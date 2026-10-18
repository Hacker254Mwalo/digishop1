import express, { type Application } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerDarajaCallback } from "./daraja";
import { appRouter } from "../routers";
import { isCustomerAccountSchemaReady } from "../db";
import { createContext } from "./context";
import { ENV } from "./env";

export function createApiApp(): Application {
  const app = express();
  registerDarajaCallback(app);
  app.get("/api/customer-auth/config", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    // Supabase publishable keys are designed for browser use. Never return the
    // service-role key from this endpoint.
    const configured = ENV.customerAccountsEnabled && Boolean(ENV.supabaseUrl && ENV.supabasePublishableKey && ENV.supabaseSecretKey);
    const enabled = configured && await isCustomerAccountSchemaReady();
    res.status(200).json({
      enabled,
      supabaseUrl: enabled ? ENV.supabaseUrl : undefined,
      publishableKey: enabled ? ENV.supabasePublishableKey : undefined,
    });
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  return app;
}

export default createApiApp;
