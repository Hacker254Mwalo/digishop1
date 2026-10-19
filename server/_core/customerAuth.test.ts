import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  ENV: {
    supabaseUrl: "https://test.supabase.co",
    supabasePublishableKey: "publishable-test-key",
    supabaseSecretKey: "service-test-key",
    customerAccountsEnabled: true,
  },
}));

const dbMocks = vi.hoisted(() => ({
  consumeCustomerSignupAttempt: vi.fn(),
  getCustomerAccount: vi.fn(),
  saveCustomerAccount: vi.fn(),
  CustomerAccountConflictError: class CustomerAccountConflictError extends Error {},
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: authMocks.createClient }));
vi.mock("./env", () => ({ ENV: authMocks.ENV }));
vi.mock("../db", () => dbMocks);

import { assertCustomerRequestOrigin, CustomerSignupRateLimitError, getCustomerFromRequest, registerPasswordCustomer } from "./customerAuth";
import type { Request } from "express";

function requestWithToken(token?: string) {
  return { get: vi.fn().mockReturnValue(token) } as unknown as Request;
}

function requestForSignup() {
  return {
    get: vi.fn((name: string) => name.toLowerCase() === "x-forwarded-for" ? "192.0.2.15" : undefined),
    ip: "192.0.2.15",
    socket: { remoteAddress: "192.0.2.15" },
  } as unknown as Request;
}

describe("SMS-free customer identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.ENV.customerAccountsEnabled = true;
    authMocks.createClient.mockImplementation(() => ({
      auth: {
        getUser: authMocks.getUser,
        admin: { createUser: authMocks.createUser, deleteUser: authMocks.deleteUser },
      },
    }));
    authMocks.getUser.mockResolvedValue({ data: { user: { id: "supabase-user-id" } }, error: null });
    authMocks.createUser.mockResolvedValue({ data: { user: { id: "new-supabase-user-id" } }, error: null });
    authMocks.deleteUser.mockResolvedValue({ error: null });
    dbMocks.consumeCustomerSignupAttempt.mockResolvedValue(true);
    dbMocks.getCustomerAccount.mockResolvedValue({ userId: "supabase-user-id", username: "siaya_customer", phone: "254718114009" });
    dbMocks.saveCustomerAccount.mockResolvedValue({ userId: "new-supabase-user-id", username: "siaya_customer", phone: "254718114009" });
  });

  it("does not call Supabase when no customer access token is supplied", async () => {
    await expect(getCustomerFromRequest(requestWithToken())).resolves.toBeNull();
    expect(authMocks.getUser).not.toHaveBeenCalled();
  });

  it("rejects cross-origin account actions", () => {
    const request = { get: (name: string) => name === "origin" ? "https://attacker.example" : "digitalelectronics.tech" } as unknown as Request;
    expect(() => assertCustomerRequestOrigin(request)).toThrow("Cross-origin customer account requests are not allowed.");
  });

  it("rejects customer sessions while the account feature kill switch is off", async () => {
    authMocks.ENV.customerAccountsEnabled = false;
    await expect(getCustomerFromRequest(requestWithToken("customer-access-token-1234567890"))).resolves.toBeNull();
    expect(authMocks.getUser).not.toHaveBeenCalled();
  });

  it("requires a valid Supabase session and a matching customer-account row", async () => {
    const customer = await getCustomerFromRequest(requestWithToken("customer-access-token-1234567890"));
    expect(customer).toEqual({ id: "supabase-user-id", phone: "254718114009" });
    expect(authMocks.getUser).toHaveBeenCalledWith("customer-access-token-1234567890");
    expect(dbMocks.getCustomerAccount).toHaveBeenCalledWith("supabase-user-id");
  });

  it("does not treat the phone stored on an auth identity as verified", async () => {
    authMocks.getUser.mockResolvedValueOnce({
      data: { user: { id: "supabase-user-id", phone: "+254 718 114 009", phone_confirmed_at: null } },
      error: null,
    });
    await expect(getCustomerFromRequest(requestWithToken("customer-access-token-1234567890"))).resolves.toEqual({
      id: "supabase-user-id",
      phone: "254718114009",
    });
  });

  it("rejects missing profiles, invalid stored numbers and Supabase verification failures", async () => {
    dbMocks.getCustomerAccount.mockResolvedValueOnce(null);
    await expect(getCustomerFromRequest(requestWithToken("customer-access-token-1234567890"))).resolves.toBeNull();

    dbMocks.getCustomerAccount.mockResolvedValueOnce({ userId: "supabase-user-id", username: "bad", phone: "254201234567" });
    await expect(getCustomerFromRequest(requestWithToken("customer-access-token-1234567890"))).resolves.toBeNull();

    authMocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("invalid token") });
    await expect(getCustomerFromRequest(requestWithToken("customer-access-token-1234567890"))).resolves.toBeNull();
  });

  it("creates an auto-confirmed internal password identity without sending SMS", async () => {
    const result = await registerPasswordCustomer({
      username: "Siaya_Customer",
      phone: "0718 114 009",
      password: "long-unique-password-2026",
    }, requestForSignup());
    expect(result).toEqual({ userId: "new-supabase-user-id", username: "siaya_customer", phone: "254718114009" });
    expect(authMocks.createUser).toHaveBeenCalledWith({
      email: "siaya_customer@accounts.digitalphonehub.invalid",
      password: "long-unique-password-2026",
      email_confirm: true,
    });
    expect(dbMocks.saveCustomerAccount).toHaveBeenCalledWith({
      userId: "new-supabase-user-id",
      phone: "254718114009",
      username: "siaya_customer",
    });
    expect(dbMocks.consumeCustomerSignupAttempt).toHaveBeenCalledTimes(2);
    expect(dbMocks.consumeCustomerSignupAttempt).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/), 3600, 10);
    expect(dbMocks.consumeCustomerSignupAttempt).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/), 3600, 3);
  });

  it("removes the new auth identity if account-profile persistence fails", async () => {
    dbMocks.saveCustomerAccount.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(registerPasswordCustomer({
      username: "siaya_customer",
      phone: "0718114009",
      password: "long-unique-password-2026",
    }, requestForSignup())).rejects.toThrow("The account could not be saved.");
    expect(authMocks.deleteUser).toHaveBeenCalledWith("new-supabase-user-id");
  });

  it("does not create an Auth identity when a signup limit is exhausted", async () => {
    dbMocks.consumeCustomerSignupAttempt.mockResolvedValueOnce(false);
    await expect(registerPasswordCustomer({
      username: "siaya_customer",
      phone: "0718114009",
      password: "long-unique-password-2026",
    }, requestForSignup())).rejects.toBeInstanceOf(CustomerSignupRateLimitError);
    expect(authMocks.createUser).not.toHaveBeenCalled();
  });
});
