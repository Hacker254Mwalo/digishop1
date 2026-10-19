import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { normalizeKenyanMpesaPhone } from "@shared/phone";
import { normalizeProductCategory, PRODUCT_CONDITIONS } from "@shared/productCatalog";
import { getSessionCookieOptions } from "./_core/cookies";
import { assertCustomerRequestOrigin, CustomerSignupRateLimitError, registerPasswordCustomer } from "./_core/customerAuth";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, customerProcedure, publicProcedure, router } from "./_core/trpc";
import { logoutOwner, setOwnerSession, signInOwner } from "./_core/ownerAuth";
import {
  addRepairNote,
  createOrderRequest,
  createRepairRequest,
  CustomerAccountConflictError,
  getCustomerAccount,
  getDashboardSummary,
  getRepairHistory,
  getRepairStatus,
  listAdminProducts,
  listCustomers,
  listOrderRequests,
  listProducts,
  listRepairTickets,
  listTechnicians,
  listAllTechnicians,
  listCustomerOrders,
  updateOrderStatus,
  upsertTechnician,
  updateRepairTicket,
  upsertProduct,
  removeProduct,
  setProductActive,
  uploadProductImage,
} from "./db";
import { adminCopilot, productAdvisor, repairHelper } from "./ai";
import { getGuestOrderPaymentStatus, startGuestOrderPayment } from "./_core/daraja";

const customerInput = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(40),
  email: z.string().email().max(320).optional().or(z.literal("")),
  location: z.string().trim().max(180).optional(),
});

const deviceInput = z.object({
  type: z.enum(["phone", "laptop", "tablet", "electronics", "other"]),
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(160),
  serialNumber: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const orderRequestInput = z.object({
  submissionId: z.string().regex(/^[A-F0-9]{24}$/i).transform(value => value.toUpperCase()).optional(),
  customer: customerInput,
  fulfillment: z.enum(["delivery", "collection"]),
  deliveryLocation: z.string().trim().max(180).optional(),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(z.object({
    productId: z.number().int().positive().optional(),
    productName: z.string().trim().min(1).max(180),
    quantity: z.number().int().positive().max(20),
    // This is retained only for compatibility with existing clients. The server
    // always looks up catalogue prices itself and never trusts this value.
    unitPrice: z.number().int().nonnegative().optional(),
  })).min(1).max(40),
}).superRefine((value, ctx) => {
  if (value.fulfillment === "delivery" && !value.deliveryLocation?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryLocation"], message: "A delivery town or area is required." });
  }
});

const upsertProductInput = z.object({
  id: z.number().int().positive().optional(),
  sku: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2).max(180),
  category: z.string().trim().min(1).max(64).transform(normalizeProductCategory),
  productType: z.enum(["part", "device", "accessory", "service"]),
  condition: z.enum(PRODUCT_CONDITIONS),
  description: z.string().trim().max(2000).optional(),
  compatibility: z.string().trim().max(2000).optional(),
  imageUrl: z.string().url().max(512).optional(),
  externalUrl: z.string().url().max(512).optional(),
  price: z.number().int().min(0).max(2147483647),
  stock: z.number().int().min(0).max(2147483647),
  reorderLevel: z.number().int().min(0).max(2147483647).optional(),
  availability: z.enum(["by_order", "out_of_stock"]).optional(),
}).superRefine((product, ctx) => {
  if (product.productType === "service" && product.condition !== "not_applicable") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["condition"], message: "Set service condition to Not applicable." });
  }
  if (product.productType !== "service" && product.condition === "not_applicable") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["condition"], message: "Choose the condition of the physical product." });
  }
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    ownerLogin: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(8).max(200) })).mutation(async ({ ctx, input }) => {
      const { user, accessToken, expiresAt } = await signInOwner(input.email, input.password);
      setOwnerSession(ctx.res, accessToken, expiresAt);
      return { id: user.id, email: user.email };
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const ownerLogout = logoutOwner(ctx.req, ctx.res);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      await ownerLogout;
      return { success: true } as const;
    }),
  }),
  customer: router({
    me: customerProcedure.query(async ({ ctx }) => {
      const account = await getCustomerAccount(ctx.customer.id, ctx.customer.phone);
      return account ? { username: account.username, phone: account.phone } : null;
    }),
    register: publicProcedure.input(z.object({
      username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).transform(value => value.toLowerCase()),
      phone: z.string().trim().min(7).max(40),
      password: z.string().min(12).max(128),
    }).strict()).mutation(async ({ ctx, input }) => {
      assertCustomerRequestOrigin(ctx.req);
      if (typeof ctx.res.setHeader === "function") ctx.res.setHeader("Cache-Control", "no-store, private");
      try {
        const account = await registerPasswordCustomer(input, ctx.req);
        return { username: account.username, phone: account.phone };
      } catch (error) {
        if (error instanceof CustomerAccountConflictError) {
          throw new TRPCError({ code: "CONFLICT", message: "These details are already in use. Sign in or choose different details." });
        }
        if (error instanceof CustomerSignupRateLimitError) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many account attempts. Please wait and try again later." });
        }
        throw new TRPCError({ code: "BAD_REQUEST", message: "We couldn't create the account. Check the details or try again later." });
      }
    }),
    orders: customerProcedure.query(({ ctx }) => listCustomerOrders(ctx.customer.id)),
  }),
  public: router({
    products: publicProcedure.query(() => listProducts()),
    currentCustomer: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.customer) return null;
      try {
        const account = await getCustomerAccount(ctx.customer.id, ctx.customer.phone);
        return account ? { username: account.username, phone: account.phone } : null;
      } catch {
        // Account storage is optional; a missing account migration must not
        // interrupt the public guest request flow.
        return null;
      }
    }),
    repairHelper: publicProcedure.input(z.object({ deviceType: z.enum(["phone", "laptop", "electronics"]), brand: z.string().trim().min(1).max(100), model: z.string().trim().min(1).max(160), issue: z.string().trim().min(5).max(2000) })).mutation(({ input }) => repairHelper(input)),
    productAdvisor: publicProcedure.input(z.object({ query: z.string().trim().min(3).max(500) })).mutation(({ input }) => productAdvisor(input.query)),
    createRepairRequest: publicProcedure.input(z.object({ submissionId: z.string().regex(/^[A-F0-9]{24}$/i).transform(value => value.toUpperCase()).optional(), customer: customerInput, device: deviceInput, issue: z.string().trim().min(5).max(4000), priority: z.enum(["low", "normal", "high", "urgent"]).optional() })).mutation(({ input }) => createRepairRequest(input)),
    createOrderRequest: publicProcedure.input(orderRequestInput).mutation(async ({ ctx, input }) => {
      let accountUserId: string | undefined;
      if (ctx.customer) {
        try {
          const account = await getCustomerAccount(ctx.customer.id, ctx.customer.phone);
          if (account && normalizeKenyanMpesaPhone(input.customer.phone) === account.phone) {
            accountUserId = account.userId;
          }
        } catch {
          // If optional account storage is not installed, preserve guest checkout.
        }
      }
      return createOrderRequest(input, accountUserId);
    }),
    getRepairStatus: publicProcedure.input(z.object({ reference: z.string().trim().toUpperCase().min(10).max(32).regex(/^DPH-REP-[A-Z0-9]{1,24}$/, "Enter a valid repair reference.") })).query(({ input }) => getRepairStatus(input.reference)),
    getOrderPaymentStatus: publicProcedure.input(z.object({ reference: z.string().trim().toUpperCase().regex(/^DPH-ORD-[A-F0-9]{24}$/, "Enter a valid order reference.") })).query(({ input }) => getGuestOrderPaymentStatus(input.reference)),
    startOrderPayment: publicProcedure.input(z.object({ reference: z.string().trim().toUpperCase().regex(/^DPH-ORD-[A-F0-9]{24}$/, "Enter a valid order reference."), idempotencyKey: z.string().regex(/^[A-F0-9]{24}$/i).transform(value => value.toUpperCase()) }).strict()).mutation(({ input }) => startGuestOrderPayment(input)),
  }),
  admin: router({
    summary: adminProcedure.query(() => getDashboardSummary()),
    repairs: adminProcedure.query(() => listRepairTickets()),
    customerHistory: adminProcedure.input(z.object({ customerId: z.number().int().positive(), deviceId: z.number().int().positive() })).query(({ input }) => getRepairHistory(input)),
    customers: adminProcedure.query(() => listCustomers()),
    products: adminProcedure.query(() => listAdminProducts()),
    orders: adminProcedure.query(() => listOrderRequests()),
    technicians: adminProcedure.query(() => listTechnicians()),
    allTechnicians: adminProcedure.query(() => listAllTechnicians()),
    upsertTechnician: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), name: z.string().trim().min(2).max(160), phone: z.string().trim().max(40).optional(), specialty: z.string().trim().max(160).optional(), active: z.boolean().optional() })).mutation(({ input }) => upsertTechnician(input)),
    updateRepair: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["received", "diagnostics", "awaiting_approval", "in_repair", "ready", "collected", "cancelled"]).optional(), technicianId: z.number().int().positive().nullable().optional(), quotedAmount: z.number().int().nonnegative().nullable().optional() })).mutation(({ input }) => updateRepairTicket(input)),
    addNote: adminProcedure.input(z.object({ ticketId: z.number().int().positive(), note: z.string().trim().min(2).max(4000) })).mutation(({ ctx, input }) => addRepairNote({ ...input, authorId: ctx.user.id })),
    upsertProduct: adminProcedure.input(upsertProductInput).mutation(({ input }) => upsertProduct(input)),
    uploadProductImage: adminProcedure.input(z.object({ id: z.number().int().positive(), fileName: z.string().trim().min(1).max(180), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(100).max(8500000) })).mutation(({ input }) => uploadProductImage(input)),
    removeProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => removeProduct(input)),
    setProductActive: adminProcedure.input(z.object({ id: z.number().int().positive(), active: z.boolean() })).mutation(({ input }) => setProductActive(input)),
    updateOrder: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "confirmed", "fulfilled", "cancelled"]) })).mutation(({ input }) => updateOrderStatus(input)),
    copilot: adminProcedure.input(z.object({ question: z.string().trim().min(3).max(600) })).mutation(({ input }) => adminCopilot(input.question)),
  }),
});

export type AppRouter = typeof appRouter;
