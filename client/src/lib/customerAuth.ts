import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeKenyanMpesaPhone } from "@shared/phone";

export { normalizeKenyanMpesaPhone };

let customerClientPromise: Promise<SupabaseClient | null> | null = null;

export async function getCustomerAuthClient(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined") return null;
  if (!customerClientPromise) {
    customerClientPromise = fetch("/api/customer-auth/config", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async response => {
        if (!response.ok) throw new Error("Customer authentication settings are unavailable.");
        const config = await response.json() as {
          enabled?: boolean;
          supabaseUrl?: string;
          publishableKey?: string;
        };
        if (!config.enabled || !config.supabaseUrl || !config.publishableKey) return null;
        return createClient(config.supabaseUrl, config.publishableKey, {
          auth: {
            autoRefreshToken: true,
            detectSessionInUrl: false,
            persistSession: true,
            storage: window.sessionStorage,
          },
        });
      })
      .catch(() => {
        customerClientPromise = null;
        return null;
      });
  }
  return customerClientPromise;
}
