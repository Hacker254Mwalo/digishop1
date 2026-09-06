import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import cookie from "cookie";
import type { Request, Response } from "express";
import { ENV } from "./env";

export const OWNER_SESSION_COOKIE = "dph-owner-session";

function serializeOwnerCookie(value: string, maxAge: number) {
  return `${OWNER_SESSION_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${ENV.isProduction ? "; Secure" : ""}`;
}

let _authClient: ReturnType<typeof createClient> | null = null;

function getAuthClient() {
  if (!_authClient && ENV.supabaseUrl && ENV.supabasePublishableKey) {
    _authClient = createClient(ENV.supabaseUrl, ENV.supabasePublishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _authClient;
}

function requireOwnerEmail(email: string) {
  const expected = ENV.ownerEmail.trim().toLowerCase();
  if (!expected || email.trim().toLowerCase() !== expected) {
    throw new Error("Owner email is not authorized");
  }
}

export async function signInOwner(email: string, password: string) {
  requireOwnerEmail(email);
  const client = getAuthClient();
  if (!client) throw new Error("Supabase authentication is not configured");
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.session || !data.user) throw new Error(error?.message ?? "Owner sign-in failed");
  return { user: data.user, accessToken: data.session.access_token };
}

export async function getOwnerFromRequest(req: Request): Promise<SupabaseUser | null> {
  const token = cookie.parse(req.headers.cookie ?? "")[OWNER_SESSION_COOKIE];
  if (!token) return null;
  const client = getAuthClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || !data.user.email) return null;
  try {
    requireOwnerEmail(data.user.email);
    return data.user;
  } catch {
    return null;
  }
}

export function setOwnerSession(res: Response, accessToken: string) {
  res.setHeader("Set-Cookie", serializeOwnerCookie(accessToken, 60 * 60 * 24 * 7));
}

export function clearOwnerSession(res: Response) {
  if (typeof res.setHeader === "function") {
    res.setHeader("Set-Cookie", serializeOwnerCookie("", 0));
  } else if (typeof (res as Response & { clearCookie?: (name: string, options?: object) => void }).clearCookie === "function") {
    (res as Response & { clearCookie: (name: string, options?: object) => void }).clearCookie(OWNER_SESSION_COOKIE, { maxAge: 0, path: "/" });
  }
}
