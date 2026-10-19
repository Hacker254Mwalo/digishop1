import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getOwnerFromRequest } from "./ownerAuth";
import { getUserByOpenId, upsertUser } from "../db";
import { getCustomerFromRequest, type CustomerIdentity } from "./customerAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  customer: CustomerIdentity | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const owner = await getOwnerFromRequest(opts.req);
    if (owner?.email) {
      await upsertUser({
        openId: owner.id,
        name: owner.user_metadata?.full_name ?? owner.email,
        email: owner.email,
        loginMethod: "supabase-email",
        role: "admin",
        lastSignedIn: new Date(),
      });
      user = await getUserByOpenId(owner.id);
    }
  } catch {
    user = null;
  }

  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  const customer = await getCustomerFromRequest(opts.req);

  return {
    req: opts.req,
    res: opts.res,
    user,
    customer,
  };
}
