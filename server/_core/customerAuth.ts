import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request } from "express";
import { normalizeKenyanMpesaPhone } from "@shared/phone";
import { ENV } from "./env";

export type VerifiedCustomer = {
  id: string;
  phone: string;
};

let authClient: SupabaseClient | null = null;

function getAuthClient() {
  if (!ENV.supabaseUrl || !ENV.supabasePublishableKey) return null;
  if (!authClient) {
    authClient = createClient(ENV.supabaseUrl, ENV.supabasePublishableKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return authClient;
}

export async function getVerifiedCustomerFromRequest(req: Request): Promise<VerifiedCustomer | null> {
  if (!ENV.customerAccountsEnabled) return null;
  const token = req.get("x-customer-access-token")?.trim();
  if (!token || token.length < 20 || token.length > 8192) return null;

  const client = getAuthClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getUser(token);
    const user = data.user;
    if (error || !user?.id || !user.phone || !user.phone_confirmed_at) return null;
    const phone = normalizeKenyanMpesaPhone(user.phone);
    if (!phone) return null;
    return { id: user.id, phone };
  } catch {
    // Invalid, expired or temporarily unverifiable customer sessions never
    // affect the anonymous customer and guest-request paths.
    return null;
  }
}
