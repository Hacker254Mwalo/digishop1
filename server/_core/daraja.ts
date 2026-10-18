import {
  createPaymentAttempt,
  countPaymentAttemptsSince,
  claimDarajaCallback,
  getActivePaymentAttempt,
  getLatestPaymentAttempt,
  getOrderPaymentContext,
  getOrderPaymentContextById,
  getPaymentAttemptByCheckoutId,
  getPaymentAttemptByIdempotencyKey,
  getQueuedDarajaCallback,
  isDarajaPaymentStorageReady,
  markQueuedDarajaCallbackProcessed,
  recordVerifiedDarajaPayment,
  storeDarajaCallback,
  updatePaymentAttempt,
} from "../db";
import express from "express";
import { ENV } from "./env";

export type PublicPaymentStatus = "not_configured" | "setup_required" | "not_started" | "initiating" | "pending" | "paid" | "failed" | "review" | "rate_limited";

type DarajaConfiguration = {
  environment: "sandbox" | "production";
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  transactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
  callbackUrl: string;
  baseUrl: string;
};

type DarajaJson = Record<string, unknown>;
type DarajaResponse = {
  ResponseCode?: string | number;
  ResponseDescription?: string;
  CustomerMessage?: string;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode?: string | number;
  ResultDesc?: string;
};

class DarajaRejectedRequest extends Error {}
class DarajaPreflightError extends Error {}
let accessTokenCache: { token: string; expiresAt: number } | null = null;

function readConfiguration(): DarajaConfiguration | null {
  const environment = ENV.mpesaDarajaEnvironment;
  const transactionType = ENV.mpesaDarajaTransactionType;
  const callbackUrl = ENV.mpesaDarajaCallbackUrl;
  const deploymentEnvironment = process.env.VERCEL_ENV;
  const deploymentUrl = process.env.VERCEL_URL;
  if (environment !== "sandbox" && environment !== "production") return null;
  if (environment === "production" && deploymentEnvironment !== "production") return null;
  if (environment === "sandbox" && deploymentEnvironment !== "preview") return null;
  if (transactionType !== "CustomerPayBillOnline" && transactionType !== "CustomerBuyGoodsOnline") return null;
  if (!ENV.mpesaDarajaConsumerKey || !ENV.mpesaDarajaConsumerSecret || !ENV.mpesaDarajaPasskey) return null;
  if (!/^\d{5,7}$/.test(ENV.mpesaDarajaShortcode)) return null;

  try {
    const parsedCallback = new URL(callbackUrl);
    const expectedOrigin = environment === "production" ? "https://digitalelectronics.tech" : deploymentUrl ? `https://${deploymentUrl}` : "";
    if (!expectedOrigin || parsedCallback.origin !== expectedOrigin || parsedCallback.pathname !== "/api/mpesa/callback" || parsedCallback.search || parsedCallback.hash || parsedCallback.username || parsedCallback.password) return null;
  } catch {
    return null;
  }

  return {
    environment,
    consumerKey: ENV.mpesaDarajaConsumerKey,
    consumerSecret: ENV.mpesaDarajaConsumerSecret,
    shortcode: ENV.mpesaDarajaShortcode,
    passkey: ENV.mpesaDarajaPasskey,
    transactionType,
    callbackUrl,
    baseUrl: environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke",
  };
}

export function isDarajaConfigured() {
  return readConfiguration() !== null;
}

export function normalizeKenyanMpesaPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const national = digits.startsWith("254") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (!/^(?:7|1)\d{8}$/.test(national)) return null;
  return `254${national}`;
}

function darajaTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

function darajaPassword(shortcode: string, passkey: string, timestamp: string) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

async function responseJson(response: Response): Promise<DarajaJson> {
  try {
    const value: unknown = await response.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as DarajaJson : {};
  } catch {
    return {};
  }
}

async function getAccessToken(configuration: DarajaConfiguration): Promise<string> {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 15_000) return accessTokenCache.token;
  const credentials = Buffer.from(`${configuration.consumerKey}:${configuration.consumerSecret}`).toString("base64");
  let response: Response;
  try {
    response = await fetch(`${configuration.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: "GET",
      headers: { Authorization: `Basic ${credentials}`, Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new DarajaPreflightError("M-PESA authentication could not be reached. No prompt was sent.");
  }
  const data = await responseJson(response);
  const token = typeof data.access_token === "string" ? data.access_token : "";
  const expiresIn = Number(data.expires_in ?? 0);
  if (!response.ok || !token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new DarajaPreflightError("M-PESA authentication is unavailable. No prompt was sent.");
  }
  accessTokenCache = { token, expiresAt: Date.now() + Math.max(30, expiresIn - 30) * 1000 };
  return token;
}

async function darajaPost(path: string, body: DarajaJson, configuration: DarajaConfiguration): Promise<DarajaResponse> {
  const token = await getAccessToken(configuration);
  let response: Response;
  try {
    response = await fetch(`${configuration.baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("M-PESA did not return a reliable response. No payment was confirmed.");
  }
  const data = await responseJson(response) as DarajaResponse;
  if (!response.ok && response.status >= 500) throw new Error("M-PESA returned an uncertain server response; payment outcome requires review.");
  if (!response.ok) throw new DarajaRejectedRequest("M-PESA rejected the request. No payment was confirmed.");
  return data;
}

async function initiateStkPush(input: { phone: string; amount: number; reference: string }, configuration: DarajaConfiguration) {
  const timestamp = darajaTimestamp();
  const shortReference = `DPH${input.reference.replace(/[^A-F0-9]/gi, "").slice(-9)}`.slice(0, 12);
  const response = await darajaPost("/mpesa/stkpush/v1/processrequest", {
    BusinessShortCode: configuration.shortcode,
    Password: darajaPassword(configuration.shortcode, configuration.passkey, timestamp),
    Timestamp: timestamp,
    TransactionType: configuration.transactionType,
    Amount: input.amount,
    PartyA: input.phone,
    PartyB: configuration.shortcode,
    PhoneNumber: input.phone,
    CallBackURL: configuration.callbackUrl,
    AccountReference: shortReference,
    TransactionDesc: "DPH Order",
  }, configuration);

  if (response.ResponseCode !== undefined && String(response.ResponseCode) !== "0") {
    throw new DarajaRejectedRequest("M-PESA did not accept the payment request. No payment was confirmed.");
  }
  if (!response.CheckoutRequestID || !response.MerchantRequestID) throw new Error("M-PESA did not return the identifiers needed to verify the prompt.");
  return { checkoutRequestId: response.CheckoutRequestID, merchantRequestId: response.MerchantRequestID };
}

async function queryStkPush(checkoutRequestId: string, configuration: DarajaConfiguration) {
  const timestamp = darajaTimestamp();
  const response = await darajaPost("/mpesa/stkpushquery/v1/query", {
    BusinessShortCode: configuration.shortcode,
    Password: darajaPassword(configuration.shortcode, configuration.passkey, timestamp),
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  }, configuration);
  return response;
}

function toPublicPaymentStatus(attempt: any): PublicPaymentStatus {
  if (attempt?.status === "initiating" || attempt?.status === "pending" || attempt?.status === "paid" || attempt?.status === "failed" || attempt?.status === "review") return attempt.status;
  return "not_started";
}

export async function getGuestOrderPaymentStatus(reference: string) {
  const context = await getOrderPaymentContext(reference);
  if (!context) return null;

  let attempt: any = null;
  let paymentStorageReady = await isDarajaPaymentStorageReady().catch(() => false);
  let recentAttempts = 0;
  try {
    if (!paymentStorageReady) throw new Error("Payment migration is not ready");
    attempt = await getLatestPaymentAttempt(context.order.id);
    recentAttempts = await countPaymentAttemptsSince(context.order.id, new Date(Date.now() - 10 * 60 * 1000).toISOString());
  } catch {
    paymentStorageReady = false;
  }
  const configured = isDarajaConfigured();
  const total = Number(context.order.total);
  const orderCanBePaid = context.order.status === "confirmed" && Number.isSafeInteger(total) && total > 0 && context.allItemsPriced;
  const active = attempt && ["initiating", "pending", "review"].includes(attempt.status);
  const rateLimited = recentAttempts >= 3 && !active && attempt?.status !== "paid";
  const status: PublicPaymentStatus = !paymentStorageReady ? "setup_required" : rateLimited ? "rate_limited" : attempt ? toPublicPaymentStatus(attempt) : configured ? "not_started" : "not_configured";
  return {
    reference: context.order.reference,
    orderStatus: context.order.status,
    total: orderCanBePaid ? total : null,
    paymentStatus: status,
    paymentAvailable: configured && paymentStorageReady,
    canPay: configured && paymentStorageReady && orderCanBePaid && !active && attempt?.status !== "paid" && !rateLimited,
    updatedAt: context.order.updatedAt,
  };
}

export async function startGuestOrderPayment(input: { reference: string; idempotencyKey: string }) {
  const configuration = readConfiguration();
  if (!configuration) {
    return { status: "not_configured" as const, message: "M-PESA checkout is not enabled yet. Contact the Siaya service desk; no payment was taken." };
  }
  if (!await isDarajaPaymentStorageReady().catch(() => false)) {
    return { status: "setup_required" as const, message: "M-PESA payment safeguards are not ready. Contact the service desk; no payment was taken." };
  }

  const context = await getOrderPaymentContext(input.reference);
  if (!context) return { status: "not_found" as const, message: "We could not find that order reference. Check it and contact the service desk if needed." };
  const amount = Number(context.order.total);
  if (context.order.status !== "confirmed" || !Number.isSafeInteger(amount) || amount <= 0 || !context.allItemsPriced) {
    return { status: "not_payable" as const, message: "This request is not ready for payment. The service desk must confirm stock and the final price first." };
  }

  let latestAttempt: any;
  try {
    latestAttempt = await getLatestPaymentAttempt(context.order.id);
  } catch {
    return { status: "setup_required" as const, message: "M-PESA payment storage is not ready. Contact the service desk; no payment was taken." };
  }
  if (latestAttempt?.status === "paid") return { status: "paid" as const, message: "This order already has a verified M-PESA payment. No second prompt was sent." };

  const existingByKey = await getPaymentAttemptByIdempotencyKey(input.idempotencyKey);
  if (existingByKey && Number(existingByKey.orderRequestId) !== Number(context.order.id)) return { status: "not_found" as const, message: "This payment request cannot be matched to the order. Contact the service desk." };
  if (existingByKey) return { status: toPublicPaymentStatus(existingByKey), message: "This payment request is already recorded. Check the M-PESA prompt or the order status before trying again." };

  const active = await getActivePaymentAttempt(context.order.id);
  if (active) return { status: toPublicPaymentStatus(active), message: active.status === "review" ? "The payment response needs service-desk review. Do not start another prompt; contact the shop with your order reference." : "A payment prompt is already in progress. Check the phone linked to your request before retrying." };

  let recentAttempts: number;
  try {
    recentAttempts = await countPaymentAttemptsSince(context.order.id, new Date(Date.now() - 10 * 60 * 1000).toISOString());
  } catch {
    return { status: "setup_required" as const, message: "M-PESA payment storage is not ready. Contact the service desk; no payment was taken." };
  }
  if (recentAttempts >= 3) return { status: "rate_limited" as const, message: "Too many M-PESA prompts were requested for this order. Wait ten minutes or contact the service desk." };

  const phone = normalizeKenyanMpesaPhone(context.customerPhone);
  if (!phone) return { status: "invalid_phone" as const, message: "The phone number on this request cannot receive an M-PESA prompt. Contact the service desk to update it." };

  let attempt: any;
  try {
    attempt = await createPaymentAttempt({ orderRequestId: context.order.id, idempotencyKey: input.idempotencyKey, amount, phone, status: "initiating" });
  } catch {
    const duplicate = await getPaymentAttemptByIdempotencyKey(input.idempotencyKey).catch(() => null);
    if (duplicate && Number(duplicate.orderRequestId) !== Number(context.order.id)) return { status: "not_found" as const, message: "This payment request cannot be matched to the order. Contact the service desk." };
    if (duplicate) return { status: toPublicPaymentStatus(duplicate), message: "This payment request is already recorded. Check the M-PESA prompt or the order status before trying again." };
    const concurrent = await getActivePaymentAttempt(context.order.id).catch(() => null);
    if (concurrent) return { status: toPublicPaymentStatus(concurrent), message: "A payment prompt is already in progress. Check the phone linked to your request before retrying." };
    return { status: "setup_required" as const, message: "M-PESA payment storage is not ready. Contact the service desk; no payment was taken." };
  }

  try {
    const currentOrder = await getOrderPaymentContext(input.reference);
    const currentAmount = Number(currentOrder?.order.total);
    const currentPhone = currentOrder ? normalizeKenyanMpesaPhone(currentOrder.customerPhone) : null;
    if (!currentOrder || currentOrder.order.status !== "confirmed" || currentAmount !== amount || !Number.isSafeInteger(currentAmount) || currentAmount <= 0 || !currentOrder.allItemsPriced) {
      await updatePaymentAttempt({ id: attempt.id, status: "failed", resultCode: "ORDER_CHANGED", resultDescription: "Order status, price or catalogue lines changed before the M-PESA prompt was sent." });
      return { status: "not_payable" as const, message: "The order changed before payment started. Contact the service desk to confirm the current order and total." };
    }
    if (!currentPhone || currentPhone !== phone) {
      await updatePaymentAttempt({ id: attempt.id, status: "failed", resultCode: "PHONE_CHANGED", resultDescription: "The saved customer phone changed before the M-PESA prompt was sent." });
      return { status: "invalid_phone" as const, message: "The phone number on this request changed or cannot receive an M-PESA prompt. Contact the service desk." };
    }
  } catch {
    await updatePaymentAttempt({ id: attempt.id, status: "review", resultCode: "ORDER_RECHECK_ERROR", resultDescription: "Order could not be rechecked before M-PESA initiation; no prompt was sent." }).catch(() => undefined);
    return { status: "setup_required" as const, message: "We could not recheck the order before payment. No prompt was sent; contact the service desk." };
  }

  try {
    const result = await initiateStkPush({ phone, amount, reference: context.order.reference }, configuration);
    let updated = await updatePaymentAttempt({ id: attempt.id, status: "pending", checkoutRequestId: result.checkoutRequestId, merchantRequestId: result.merchantRequestId, resultDescription: "STK prompt accepted; awaiting customer and provider confirmation." });
    const queuedCallback = await getQueuedDarajaCallback(result.checkoutRequestId).catch(() => null);
    if (queuedCallback) {
      await reconcileDarajaCallback(queuedCallback);
      await markQueuedDarajaCallbackProcessed(result.checkoutRequestId);
      updated = await getLatestPaymentAttempt(context.order.id) ?? updated;
    }
    if (updated.status === "paid") return { status: "paid" as const, message: "M-PESA payment has been verified for this order." };
    if (updated.status === "failed") return { status: "failed" as const, message: "Daraja confirmed that the payment did not complete. You can retry, or contact the service desk if you believe you were charged." };
    if (updated.status === "review") return { status: "review" as const, message: "The payment response needs service-desk review. Do not start another prompt; contact the shop with your order reference." };
    return { status: "pending" as const, message: "M-PESA accepted the prompt request. Check the phone linked to your order and approve it there. This is not yet a payment confirmation." };
  } catch (error) {
    const definitiveReject = error instanceof DarajaRejectedRequest || error instanceof DarajaPreflightError;
    const status = definitiveReject ? "failed" : "review";
    const updated = await updatePaymentAttempt({ id: attempt.id, status, resultDescription: definitiveReject ? "Daraja rejected the request; no payment confirmation was received." : "The request response was uncertain; service-desk review is required before retry." }).catch(() => null);
    if (updated?.status === "paid") return { status: "paid" as const, message: "M-PESA payment has been verified for this order." };
    return {
      status,
      message: definitiveReject
        ? "M-PESA did not accept the request. No payment was confirmed; you may retry or contact the service desk."
        : "We could not confirm whether M-PESA received the prompt. Do not retry yet; contact the service desk with your order reference.",
    };
  }
}

function minimizedCallbackPayload(callback: any, checkoutRequestId: string, merchantRequestId: string, resultCode: number) {
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: merchantRequestId,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: resultCode,
        ResultDesc: typeof callback?.ResultDesc === "string" ? callback.ResultDesc.slice(0, 500) : "",
      },
    },
  };
}

export async function reconcileDarajaCallback(body: unknown): Promise<{ httpStatus: number; response: { ResultCode: number; ResultDesc: string } }> {
  const callback = (body as any)?.Body?.stkCallback;
  const checkoutRequestId = typeof callback?.CheckoutRequestID === "string" ? callback.CheckoutRequestID : "";
  const merchantRequestId = typeof callback?.MerchantRequestID === "string" ? callback.MerchantRequestID : "";
  const resultCode = Number(callback?.ResultCode);
  if (!callback || !checkoutRequestId || checkoutRequestId.length > 128 || !merchantRequestId || merchantRequestId.length > 128 || !Number.isInteger(resultCode)) {
    return { httpStatus: 400, response: { ResultCode: 1, ResultDesc: "Invalid callback payload" } };
  }

  const attempt = await getPaymentAttemptByCheckoutId(checkoutRequestId);
  if (!attempt) {
    await storeDarajaCallback({ checkoutRequestId, merchantRequestId, payload: minimizedCallbackPayload(callback, checkoutRequestId, merchantRequestId, resultCode) });
    return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Callback queued for reconciliation" } };
  }
  if (attempt.status === "paid") return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Callback already processed" } };
  if (!attempt.merchantRequestId) {
    await storeDarajaCallback({ checkoutRequestId, merchantRequestId, payload: minimizedCallbackPayload(callback, checkoutRequestId, merchantRequestId, resultCode) });
    return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Callback queued for reconciliation" } };
  }
  if (String(attempt.merchantRequestId) !== merchantRequestId) {
    return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Callback identifier did not match" } };
  }

  if (!await claimDarajaCallback(checkoutRequestId)) {
    return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Callback already received" } };
  }
  const configuration = readConfiguration();
  if (!configuration || !attempt.checkoutRequestId) {
    await updatePaymentAttempt({ id: attempt.id, status: "review", resultCode: "VERIFY_UNAVAILABLE", resultDescription: "Daraja credentials are unavailable for provider reconciliation." });
    return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Callback held for verification" } };
  }

  try {
    const providerStatus = await queryStkPush(attempt.checkoutRequestId, configuration);
    if (String(providerStatus.ResponseCode ?? "") !== "0" || !Number.isInteger(Number(providerStatus.ResultCode))) {
      await updatePaymentAttempt({ id: attempt.id, status: "review", resultCode: String(providerStatus.ResultCode ?? "QUERY_PENDING"), resultDescription: "Provider query did not return a final result; service-desk review is required." });
      return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Callback held for verification" } };
    }
    const verifiedResultCode = Number(providerStatus.ResultCode);
    if (verifiedResultCode !== 0) {
      await updatePaymentAttempt({ id: attempt.id, status: "failed", resultCode: String(verifiedResultCode), resultDescription: typeof providerStatus.ResultDesc === "string" ? providerStatus.ResultDesc.slice(0, 500) : "Daraja query confirmed the payment did not complete." });
      return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Provider query confirmed unsuccessful payment" } };
    }
    const orderContext = await getOrderPaymentContextById(Number(attempt.orderRequestId));
    if (!orderContext || orderContext.order.status !== "confirmed" || Number(orderContext.order.total) !== Number(attempt.amount) || !orderContext.allItemsPriced || normalizeKenyanMpesaPhone(orderContext.customerPhone) !== attempt.phone) {
      await updatePaymentAttempt({ id: attempt.id, status: "review", resultCode: "ORDER_MISMATCH", resultDescription: "Verified provider payment did not match the current saved order total." });
      return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Payment held for service-desk review" } };
    }

    const paid = await recordVerifiedDarajaPayment({ attemptId: Number(attempt.id), checkoutRequestId, merchantRequestId, resultDescription: typeof providerStatus.ResultDesc === "string" ? providerStatus.ResultDesc : "Daraja provider query confirmed the saved order payment." });
    return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: paid ? "Payment confirmed" : "Payment held for service-desk review" } };
  } catch {
    await updatePaymentAttempt({ id: attempt.id, status: "review", resultCode: "VERIFY_ERROR", resultDescription: "Provider verification could not be completed; service-desk review is required." }).catch(() => undefined);
    return { httpStatus: 200, response: { ResultCode: 0, ResultDesc: "Callback held for verification" } };
  }
}


export function registerDarajaCallback(app: import("express").Application) {
  app.post("/api/mpesa/callback", express.json({ limit: "64kb" }), async (request: import("express").Request, response: import("express").Response) => {
    try {
      const result = await reconcileDarajaCallback(request.body);
      response.status(result.httpStatus).json(result.response);
    } catch {
      response.status(503).json({ ResultCode: 1, ResultDesc: "Payment callback could not be stored; retry later." });
    }
  });
}
