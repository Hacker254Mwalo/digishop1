import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  ENV: { supabaseUrl: "https://test.supabase.co", supabasePublishableKey: "publishable-test-key", customerAccountsEnabled: true },
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: authMocks.createClient }));
vi.mock("./env", () => ({ ENV: authMocks.ENV }));

import { getVerifiedCustomerFromRequest } from "./customerAuth";
import type { Request } from "express";

function requestWithToken(token?: string) {
  return { get: vi.fn().mockReturnValue(token) } as unknown as Request;
}

describe("verified customer identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.ENV.customerAccountsEnabled = true;
    authMocks.createClient.mockReturnValue({ auth: { getUser: authMocks.getUser } });
    authMocks.getUser.mockResolvedValue({
      data: { user: { id: "supabase-user-id", phone: "+254 718 114 009", phone_confirmed_at: "2026-10-18T00:00:00.000Z" } },
      error: null,
    });
  });

  it("does not call Supabase when no customer access token is supplied", async () => {
    await expect(getVerifiedCustomerFromRequest(requestWithToken())).resolves.toBeNull();
    expect(authMocks.getUser).not.toHaveBeenCalled();
  });

  it("rejects customer sessions while the account feature kill switch is off", async () => {
    authMocks.ENV.customerAccountsEnabled = false;
    await expect(getVerifiedCustomerFromRequest(requestWithToken("verified-access-token-1234567890"))).resolves.toBeNull();
    expect(authMocks.getUser).not.toHaveBeenCalled();
  });

  it("normalizes the phone only after Supabase verifies a confirmed user", async () => {
    const customer = await getVerifiedCustomerFromRequest(requestWithToken("verified-access-token-1234567890"));
    expect(customer).toEqual({ id: "supabase-user-id", phone: "254718114009" });
    expect(authMocks.getUser).toHaveBeenCalledWith("verified-access-token-1234567890");
  });

  it("rejects users whose phone has not been confirmed", async () => {
    authMocks.getUser.mockResolvedValueOnce({
      data: { user: { id: "supabase-user-id", phone: "0718114009", phone_confirmed_at: null } },
      error: null,
    });
    await expect(getVerifiedCustomerFromRequest(requestWithToken("verified-access-token-1234567890"))).resolves.toBeNull();
  });

  it("rejects invalid Kenyan phone numbers and Supabase verification failures", async () => {
    authMocks.getUser.mockResolvedValueOnce({
      data: { user: { id: "supabase-user-id", phone: "+254 201 234 567", phone_confirmed_at: "2026-10-18T00:00:00.000Z" } },
      error: null,
    });
    await expect(getVerifiedCustomerFromRequest(requestWithToken("verified-access-token-1234567890"))).resolves.toBeNull();

    authMocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("invalid token") });
    await expect(getVerifiedCustomerFromRequest(requestWithToken("verified-access-token-1234567890"))).resolves.toBeNull();
  });
});
