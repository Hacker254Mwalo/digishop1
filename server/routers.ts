import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { clearOwnerSession, setOwnerSession, signInOwner } from "./_core/ownerAuth";
import {
  addRepairNote,
  createOrderRequest,
  createRepairRequest,
  getDashboardSummary,
  getRepairHistory,
  getRepairStatus,
  listOrderRequests,
  listProducts,
  listRepairTickets,
  listTechnicians,
  listAllTechnicians,
  updateOrderStatus,
  upsertTechnician,
  updateRepairTicket,
  upsertProduct,
  removeProduct,
  uploadProductImage,
} from "./db";

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

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    ownerLogin: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(8).max(200) })).mutation(async ({ ctx, input }) => {
      const { user, accessToken } = await signInOwner(input.email, input.password);
      setOwnerSession(ctx.res, accessToken);
      return { id: user.id, email: user.email };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      if ((ctx.req.headers.cookie ?? "").includes("dph-owner-session=")) clearOwnerSession(ctx.res);
      return { success: true } as const;
    }),
  }),
  public: router({
    products: publicProcedure.query(() => listProducts()),
    createRepairRequest: publicProcedure.input(z.object({ customer: customerInput, device: deviceInput, issue: z.string().trim().min(5).max(4000), priority: z.enum(["low", "normal", "high", "urgent"]).optional() })).mutation(({ input }) => createRepairRequest(input)),
    createOrderRequest: publicProcedure.input(z.object({ customer: customerInput, fulfillment: z.enum(["delivery", "collection"]), deliveryLocation: z.string().trim().max(180).optional(), notes: z.string().trim().max(2000).optional(), items: z.array(z.object({ productId: z.number().int().positive().optional(), productName: z.string().trim().min(1).max(180), quantity: z.number().int().positive().max(20), unitPrice: z.number().int().nonnegative() })).min(1).max(40) })).mutation(({ input }) => createOrderRequest(input)),
    getRepairStatus: publicProcedure.input(z.object({ reference: z.string().trim().min(6).max(32) })).query(({ input }) => getRepairStatus(input.reference)),
  }),
  admin: router({
    summary: adminProcedure.query(() => getDashboardSummary()),
    repairs: adminProcedure.query(() => listRepairTickets()),
    customerHistory: adminProcedure.input(z.object({ customerId: z.number().int().positive(), deviceId: z.number().int().positive() })).query(({ input }) => getRepairHistory(input)),
    products: adminProcedure.query(() => listProducts()),
    orders: adminProcedure.query(() => listOrderRequests()),
    technicians: adminProcedure.query(() => listTechnicians()),
    allTechnicians: adminProcedure.query(() => listAllTechnicians()),
    upsertTechnician: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), name: z.string().trim().min(2).max(160), phone: z.string().trim().max(40).optional(), specialty: z.string().trim().max(160).optional(), active: z.boolean().optional() })).mutation(({ input }) => upsertTechnician(input)),
    updateRepair: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["received", "diagnostics", "awaiting_approval", "in_repair", "ready", "collected", "cancelled"]).optional(), technicianId: z.number().int().positive().nullable().optional(), quotedAmount: z.number().int().nonnegative().nullable().optional() })).mutation(({ input }) => updateRepairTicket(input)),
    addNote: adminProcedure.input(z.object({ ticketId: z.number().int().positive(), note: z.string().trim().min(2).max(4000) })).mutation(({ ctx, input }) => addRepairNote({ ...input, authorId: ctx.user.id })),
    upsertProduct: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), sku: z.string().trim().min(1).max(80), name: z.string().trim().min(2).max(180), category: z.enum(["phone_screen", "charging_port", "battery", "laptop_spare", "accessory", "other"]), description: z.string().trim().max(2000).optional(), compatibility: z.string().trim().max(2000).optional(), imageUrl: z.string().url().max(512).optional(), price: z.number().int().nonnegative(), stock: z.number().int().nonnegative(), reorderLevel: z.number().int().nonnegative().optional(), availability: z.enum(["in_stock", "low_stock", "out_of_stock", "by_order"]).optional() })).mutation(({ input }) => upsertProduct(input)),
    uploadProductImage: adminProcedure.input(z.object({ id: z.number().int().positive(), fileName: z.string().trim().min(1).max(180), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(100).max(8500000) })).mutation(({ input }) => uploadProductImage(input)),
    removeProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => removeProduct(input)),
    updateOrder: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "confirmed", "fulfilled", "cancelled"]) })).mutation(({ input }) => updateOrderStatus(input)),
  }),
});

export type AppRouter = typeof appRouter;
