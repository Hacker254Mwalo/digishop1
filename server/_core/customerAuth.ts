import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import type { Request } from "express";
import { normalizeKenyanMpesaPhone } from "@shared/phone";
import { customerAuthEmail } from "@shared/customerIdentity";
import { consumeCustomerSignupAttempt, CustomerAccountConflictError, getCustomerAccount, saveCustomerAccount } from "../db";
import { ENV } from "./env";

export type CustomerIdentity = {
  id: string;
  phone: string;
};

export class CustomerSignupRateLimitError extends Error {}

let authClient: SupabaseClient | null = null;
let adminAuthClient: SupabaseClient | null = null;

function getAuthClient() {
  if (!ENV.supabaseUrl || !ENV.supabasePublishableKey) return null;
  if (!authClient) {
    authClient = createClient(ENV.supabaseUrl, ENV.supabasePublishableKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return authClient;
}

function getAdminAuthClient() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) return null;
  if (!adminAuthClient) {
    adminAuthClient = createClient(ENV.supabaseUrl, ENV.supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return adminAuthClient;
}

export function assertCustomerRequestOrigin(req: Request) {
  const getHeader = (name: string) => typeof req.get === "function"
    ? req.get(name)
    : req.headers[name.toLowerCase()]?.toString();
  const origin = getHeader("origin")?.trim();
  if (!origin) return;
  const host = getHeader("host")?.trim().toLowerCase();
  try {
    if (!host || new URL(origin).host.toLowerCase() !== host) {
      throw new Error("Cross-origin customer account requests are not allowed.");
    }
  } catch {
    throw new Error("Cross-origin customer account requests are not allowed.");
  }
}

export async function registerPasswordCustomer(input: { username: string; phone: string; password: string }, req: Request) {
  if (!ENV.customerAccountsEnabled) throw new Error("Customer accounts are not enabled.");
  const phone = normalizeKenyanMpesaPhone(input.phone);
  const username = input.username.trim().toLowerCase();
  if (!phone) throw new Error("Enter a valid Kenyan mobile number.");

  const pepper = ENV.cookieSecret || ENV.supabaseSecretKey;
  if (!pepper) throw new Error("Customer account protection is not configured.");
  const forwardedAddress = req.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const address = forwardedAddress || req.ip || req.socket.remoteAddress || "unknown";
  const limits = [
    { key: `signup-ip:${address}`, maxAttempts: 10 },
    { key: `signup-phone:${phone}`, maxAttempts: 3 },
  ];
  for (const limit of limits) {
    const keyHash = createHash("sha256").update(`${pepper}\0${limit.key}`).digest("hex");
    const allowed = await consumeCustomerSignupAttempt(keyHash, 60 * 60, limit.maxAttempts);
    if (!allowed) throw new CustomerSignupRateLimitError("Customer signup rate limit reached.");
  }

  const client = getAdminAuthClient();
  if (!client) throw new Error("Customer account authentication is not configured.");
  const { data, error } = await client.auth.admin.createUser({
    email: customerAuthEmail(username),
    password: input.password,
    email_confirm: true,
  });
  if (error || !data.user?.id) {
    throw new Error("The account could not be created with those details.");
  }

  try {
    const account = await saveCustomerAccount({ userId: data.user.id, phone, username });
    return { userId: account.userId, username: account.username, phone: account.phone };
  } catch (error) {
    try {
      await client.auth.admin.deleteUser(data.user.id);
    } catch {
      // Best effort cleanup prevents an orphaned auth identity after profile failure.
    }
    if (error instanceof CustomerAccountConflictError) throw error;
    throw new Error("The account could not be saved. Please try again later.");
  }
}

export async function getCustomerFromRequest(req: Request): Promise<CustomerIdentity | null> {
  if (!ENV.customerAccountsEnabled) return null;
  const token = req.get("x-customer-access-token")?.trim();
  if (!token || token.length < 20 || token.length > 8192) return null;

  const client = getAuthClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getUser(token);
    const user = data.user;
    if (error || !user?.id) return null;
    const account = await getCustomerAccount(user.id);
    const phone = account ? normalizeKenyanMpesaPhone(account.phone) : null;
    if (!account || !phone) return null;
    return { id: user.id, phone };
  } catch {
    // Invalid, expired or temporarily unverifiable sessions never affect guest flows.
    return null;
  }
}

export { normalizeKenyanMpesaPhone };
