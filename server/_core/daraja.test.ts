import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  env: {
    mpesaDarajaEnvironment: "sandbox",
    mpesaDarajaConsumerKey: "test-consumer-key",
    mpesaDarajaConsumerSecret: "test-consumer-secret",
    mpesaDarajaShortcode: "123456",
    mpesaDarajaPasskey: "test-passkey",
    mpesaDarajaTransactionType: "CustomerPayBillOnline",
    mpesaDarajaCallbackUrl: "https://digitalelectronics.tech/api/mpesa/callback",
  },
  db: {
    claimDarajaCallback: vi.fn(),
    createPaymentAttempt: vi.fn(),
    countPaymentAttemptsSince: vi.fn(),
    getActivePaymentAttempt: vi.fn(),
    getLatestPaymentAttempt: vi.fn(),
    getOrderPaymentContext: vi.fn(),
    getOrderPaymentContextById: vi.fn(),
    getPaymentAttemptByCheckoutId: vi.fn(),
    getPaymentAttemptByIdempotencyKey: vi.fn(),
    getQueuedDarajaCallback: vi.fn(),
    isDarajaPaymentStorageReady: vi.fn(),
    markQueuedDarajaCallbackProcessed: vi.fn(),
    recordVerifiedDarajaPayment: vi.fn(),
    storeDarajaCallback: vi.fn(),
    updatePaymentAttempt: vi.fn(),
  },
}));

vi.mock("../db", () => state.db);
vi.mock("./env", () => ({ ENV: state.env }));

import { isDarajaConfigured, normalizeKenyanMpesaPhone, reconcileDarajaCallback, startGuestOrderPayment } from "./daraja";

describe("Daraja configuration", () => {
  it("accepts only the shop's exact HTTPS callback origin and endpoint", () => {
    expect(isDarajaConfigured()).toBe(true);
    state.env.mpesaDarajaCallbackUrl = "https://payments.example/api/mpesa/callback";
    expect(isDarajaConfigured()).toBe(false);
    state.env.mpesaDarajaCallbackUrl = "https://digitalelectronics.tech/api/mpesa/callback";
  });
});

describe("Daraja phone normalization", () => {
  it("normalizes local and international Kenyan mobile numbers", () => {
    expect(normalizeKenyanMpesaPhone("0718 114 009")).toBe("254718114009");
    expect(normalizeKenyanMpesaPhone("+254 718 114 009")).toBe("254718114009");
    expect(normalizeKenyanMpesaPhone("0110-234-567")).toBe("254110234567");
  });

  it("rejects malformed and non-Kenyan numbers", () => {
    expect(normalizeKenyanMpesaPhone("07181140")).toBeNull();
    expect(normalizeKenyanMpesaPhone("+1 202 555 0100")).toBeNull();
    expect(normalizeKenyanMpesaPhone("hello")).toBeNull();
  });
});

describe("guest payment initiation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.env.mpesaDarajaConsumerKey = "test-consumer-key";
    state.env.mpesaDarajaCallbackUrl = "https://digitalelectronics.tech/api/mpesa/callback";
    state.db.getOrderPaymentContext.mockResolvedValue({
      order: { id: 25, reference: "DPH-ORD-102030405060708090A0B0C", status: "confirmed", total: 1200 },
      customerPhone: "0718 114 009",
      allItemsPriced: true,
    });
    state.db.getLatestPaymentAttempt.mockResolvedValue(null);
    state.db.isDarajaPaymentStorageReady.mockResolvedValue(true);
    state.db.getPaymentAttemptByIdempotencyKey.mockResolvedValue(null);
    state.db.getActivePaymentAttempt.mockResolvedValue(null);
    state.db.countPaymentAttemptsSince.mockResolvedValue(3);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("does not touch the order or provider when merchant credentials are absent", async () => {
    state.env.mpesaDarajaConsumerKey = "";
    const result = await startGuestOrderPayment({ reference: "DPH-ORD-102030405060708090A0B0C", idempotencyKey: "102030405060708090A0B0C1" });
    expect(result.status).toBe("not_configured");
    expect(state.db.getOrderPaymentContext).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuses a fourth initiation within ten minutes without creating an attempt or sending STK", async () => {
    const result = await startGuestOrderPayment({ reference: "DPH-ORD-102030405060708090A0B0C", idempotencyKey: "102030405060708090A0B0C1" });
    expect(result.status).toBe("rate_limited");
    expect(state.db.countPaymentAttemptsSince).toHaveBeenCalledWith(25, expect.any(String));
    expect(state.db.createPaymentAttempt).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Daraja callback reconciliation", () => {
  const attempt = {
    id: 41,
    orderRequestId: 12,
    amount: 1200,
    phone: "254718114009",
    status: "pending",
    merchantRequestId: "merchant-123",
    checkoutRequestId: "ws_CO_12345",
  };

  const callback = (amount = 1200) => ({
    Body: {
      stkCallback: {
        MerchantRequestID: "merchant-123",
        CheckoutRequestID: "ws_CO_12345",
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: amount },
            { Name: "MpesaReceiptNumber", Value: "RKT1234567" },
            { Name: "PhoneNumber", Value: 254718114009 },
          ],
        },
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    state.db.getPaymentAttemptByCheckoutId.mockResolvedValue(attempt);
    state.db.getOrderPaymentContextById.mockResolvedValue({ order: { id: 12, status: "confirmed", total: 1200 }, customerPhone: "0718 114 009", allItemsPriced: true });
    state.db.updatePaymentAttempt.mockImplementation(async (input: { status: string }) => ({ ...attempt, ...input }));
    state.db.claimDarajaCallback.mockResolvedValue(true);
    state.db.recordVerifiedDarajaPayment.mockResolvedValue(true);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("ignores unsigned callback amount, phone, receipt and status in favor of the provider query", async () => {
    vi.mocked(fetch).mockImplementation(async url => new Response(JSON.stringify(String(url).includes("/oauth/v1/generate")
      ? { access_token: "unit-test-token", expires_in: "3600" }
      : { ResponseCode: "0", ResultCode: "0" }), { status: 200 }));
    const spoofed = callback(100) as any;
    spoofed.Body.stkCallback.ResultCode = 1032;
    spoofed.Body.stkCallback.CallbackMetadata.Item[1].Value = "FAKERECEIPT";
    spoofed.Body.stkCallback.CallbackMetadata.Item[2].Value = 254700000000;
    const result = await reconcileDarajaCallback(spoofed);
    expect(result.response.ResultDesc).toBe("Payment confirmed");
    expect(state.db.recordVerifiedDarajaPayment).toHaveBeenCalledWith(expect.objectContaining({
      attemptId: 41,
      checkoutRequestId: "ws_CO_12345",
      merchantRequestId: "merchant-123",
    }));
    expect(state.db.recordVerifiedDarajaPayment.mock.calls[0][0]).not.toHaveProperty("receipt");
    expect(state.db.updatePaymentAttempt).not.toHaveBeenCalledWith(expect.objectContaining({ status: "review" }));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("marks paid only after matching provider IDs and an authoritative successful query", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async url => new Response(JSON.stringify(String(url).includes("/oauth/v1/generate")
      ? { access_token: "unit-test-token", expires_in: "3600" }
      : { ResponseCode: "0", ResultCode: "0", ResultDesc: "The service request is processed successfully." }), { status: 200 }));

    const result = await reconcileDarajaCallback(callback());
    expect(result).toEqual({ httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Payment confirmed" } });
    expect(mockFetch.mock.calls.some(([url]) => String(url).includes("/mpesa/stkpushquery/v1/query"))).toBe(true);
    expect(state.db.getOrderPaymentContextById).toHaveBeenCalledWith(12);
    expect(state.db.recordVerifiedDarajaPayment).toHaveBeenCalledWith(expect.objectContaining({
      attemptId: 41,
      checkoutRequestId: "ws_CO_12345",
      merchantRequestId: "merchant-123",
    }));
    expect(state.db.updatePaymentAttempt).not.toHaveBeenCalledWith(expect.objectContaining({ status: "paid" }));
  });

  it("queues an early callback instead of acknowledging and discarding it", async () => {
    state.db.getPaymentAttemptByCheckoutId.mockResolvedValue(null);
    const result = await reconcileDarajaCallback(callback());
    expect(result.response.ResultDesc).toMatch(/queued/i);
    expect(state.db.storeDarajaCallback).toHaveBeenCalledWith(expect.objectContaining({ checkoutRequestId: "ws_CO_12345", merchantRequestId: "merchant-123" }));
    expect(state.db.storeDarajaCallback.mock.calls[0][0].payload.Body.stkCallback).not.toHaveProperty("CallbackMetadata");
    expect(state.db.claimDarajaCallback).not.toHaveBeenCalled();
  });

  it("ignores a mismatched merchant request ID without querying Daraja", async () => {
    const mismatched = callback() as any;
    mismatched.Body.stkCallback.MerchantRequestID = "other-merchant";
    const result = await reconcileDarajaCallback(mismatched);
    expect(result.response.ResultDesc).toMatch(/did not match/i);
    expect(state.db.claimDarajaCallback).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sets failed only when an authoritative provider query confirms a nonzero result", async () => {
    vi.mocked(fetch).mockImplementation(async url => new Response(JSON.stringify(String(url).includes("/oauth/v1/generate")
      ? { access_token: "unit-test-token", expires_in: "3600" }
      : { ResponseCode: "0", ResultCode: "1032", ResultDesc: "Request cancelled by user" }), { status: 200 }));
    const failed = callback() as any;
    failed.Body.stkCallback.ResultCode = 1032;
    await reconcileDarajaCallback(failed);
    expect(state.db.updatePaymentAttempt).toHaveBeenCalledWith(expect.objectContaining({ status: "failed", resultCode: "1032" }));
    expect(state.db.recordVerifiedDarajaPayment).not.toHaveBeenCalled();
  });

  it("throttles duplicate callbacks before querying Daraja", async () => {
    state.db.claimDarajaCallback.mockResolvedValue(false);
    const result = await reconcileDarajaCallback(callback());
    expect(result.response.ResultDesc).toMatch(/already received/i);
    expect(fetch).not.toHaveBeenCalled();
  });
});
