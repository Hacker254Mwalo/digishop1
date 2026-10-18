import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  addRepairNote: vi.fn().mockResolvedValue({ success: true }),
  createOrderRequest: vi.fn().mockResolvedValue({ reference: "DPH-ORD-TEST", total: 0, accountLinked: false }),
  createRepairRequest: vi.fn().mockResolvedValue({ reference: "DPH-REP-TEST", status: "received" }),
  CustomerAccountConflictError: class CustomerAccountConflictError extends Error {},
  getCustomerAccount: vi.fn().mockResolvedValue(null),
  getDashboardSummary: vi.fn().mockResolvedValue({ newRepairs: 0, activeRepairs: 0, readyRepairs: 0, lowStock: 0, pendingOrders: 0 }),
  getRepairHistory: vi.fn().mockResolvedValue({ tickets: [], notes: [] }),
  getDb: vi.fn(),
  listOrderRequests: vi.fn().mockResolvedValue([]),
  listCustomers: vi.fn().mockResolvedValue([]),
  listAdminProducts: vi.fn().mockResolvedValue([]),
  listProducts: vi.fn().mockResolvedValue([]),
  listRepairTickets: vi.fn().mockResolvedValue([]),
  listTechnicians: vi.fn().mockResolvedValue([]),
  listAllTechnicians: vi.fn().mockResolvedValue([]),
  listCustomerOrders: vi.fn().mockResolvedValue([]),
  upsertTechnician: vi.fn().mockResolvedValue({ success: true }),
  updateOrderStatus: vi.fn().mockResolvedValue({ success: true }),
  updateRepairTicket: vi.fn().mockResolvedValue({ success: true }),
  upsertProduct: vi.fn().mockResolvedValue({ success: true }),
  setProductActive: vi.fn().mockResolvedValue({ success: true }),
  saveCustomerAccount: vi.fn().mockResolvedValue({ userId: "customer-user-id", username: "siaya_customer", phone: "254718114009" }),
}));

const paymentMocks = vi.hoisted(() => ({
  getGuestOrderPaymentStatus: vi.fn().mockResolvedValue({ reference: "DPH-ORD-102030405060708090A0B0C0", orderStatus: "confirmed", total: 1200, paymentStatus: "not_configured", paymentAvailable: false, canPay: false }),
  startGuestOrderPayment: vi.fn().mockResolvedValue({ status: "not_configured", message: "M-PESA is not enabled." }),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/daraja", () => paymentMocks);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type TestUser = NonNullable<TrpcContext["user"]>;

function contextFor(user: TestUser | null, customer: TrpcContext["customer"] = null): TrpcContext {
  return {
    user,
    customer,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const baseUser: TestUser = {
  id: 10,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const owner = { ...baseUser, id: 1, openId: "owner", role: "admin" as const, name: "Shop Owner" };

describe("owner operations", () => {
  it("rejects non-admin users before protected dashboard work runs", async () => {
    const caller = appRouter.createCaller(contextFor(baseUser));
    await expect(caller.admin.summary()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects incomplete public repair requests at the contract boundary", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.public.createRepairRequest({
      customer: { name: "", phone: "0718114009" },
      device: { type: "phone", brand: "Samsung", model: "A14" },
      issue: "Screen is damaged",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("creates a valid shared repair request through the public contract", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    const result = await caller.public.createRepairRequest({
      customer: { name: "Amina Otieno", phone: "0718114009", location: "Siaya" },
      device: { type: "phone", brand: "Samsung", model: "A14" },
      issue: "The charging port is loose",
      priority: "normal",
      submissionId: "A1B2C3D4E5F60718293A4B5C",
    });
    expect(result.reference).toBe("DPH-REP-TEST");
    expect(dbMocks.createRepairRequest).toHaveBeenCalledWith(expect.objectContaining({ submissionId: "A1B2C3D4E5F60718293A4B5C" }));
  });

  it("rejects malformed public submission tokens", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.public.createRepairRequest({
      submissionId: "timestamp-123",
      customer: { name: "Amina Otieno", phone: "0718114009" },
      device: { type: "phone", brand: "Samsung", model: "A14" },
      issue: "The charging port is loose",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("creates a spare-part order request through the public contract", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    const result = await caller.public.createOrderRequest({
      customer: { name: "Brian Ochieng", phone: "0718114009" },
      fulfillment: "delivery",
      deliveryLocation: "Kisumu",
      submissionId: "102030405060708090A0B0C0",
      items: [{ productName: "Phone screen", quantity: 1, unitPrice: 0 }],
    });
    expect(result.reference).toBe("DPH-ORD-TEST");
    expect(dbMocks.createOrderRequest).toHaveBeenCalledWith(expect.objectContaining({ submissionId: "102030405060708090A0B0C0" }), undefined);
  });

  it("links an item request only when a verified account phone matches the submitted phone", async () => {
    const customer = { id: "supabase-user-id", phone: "254718114009" };
    dbMocks.getCustomerAccount.mockResolvedValueOnce({ userId: customer.id, username: "siaya_customer", phone: customer.phone });
    const caller = appRouter.createCaller(contextFor(null, customer));
    await caller.public.createOrderRequest({
      customer: { name: "Brian Ochieng", phone: "+254 718 114 009" },
      fulfillment: "delivery",
      deliveryLocation: "Kisumu",
      submissionId: "102030405060708090A0B0C2",
      items: [{ productName: "Phone screen", quantity: 1 }],
    });
    expect(dbMocks.getCustomerAccount).toHaveBeenCalledWith(customer.id, customer.phone);
    expect(dbMocks.createOrderRequest).toHaveBeenCalledWith(expect.objectContaining({ submissionId: "102030405060708090A0B0C2" }), customer.id);
  });

  it("falls back to guest ordering when the optional account table is unavailable", async () => {
    const customer = { id: "supabase-user-id", phone: "254718114009" };
    dbMocks.getCustomerAccount.mockRejectedValueOnce(new Error("customerAccounts table is missing"));
    const caller = appRouter.createCaller(contextFor(null, customer));
    await caller.public.createOrderRequest({
      customer: { name: "Brian Ochieng", phone: "0718114009" },
      fulfillment: "delivery",
      deliveryLocation: "Kisumu",
      submissionId: "102030405060708090A0B0C3",
      items: [{ productName: "Phone screen", quantity: 1 }],
    });
    expect(dbMocks.createOrderRequest).toHaveBeenCalledWith(expect.objectContaining({ submissionId: "102030405060708090A0B0C3" }), undefined);
  });

  it("keeps customer account procedures separate from owner login", async () => {
    const anonymous = appRouter.createCaller(contextFor(null));
    await expect(anonymous.customer.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const customer = { id: "supabase-user-id", phone: "254718114009" };
    const caller = appRouter.createCaller(contextFor(null, customer));
    const profile = await caller.customer.register({ username: "Siaya_Customer" });
    expect(profile).toEqual({ username: "siaya_customer", phone: "254718114009" });
    expect(dbMocks.saveCustomerAccount).toHaveBeenCalledWith({ userId: customer.id, phone: customer.phone, username: "siaya_customer" });
  });

  it("requires a delivery area before accepting a delivery request", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.public.createOrderRequest({
      customer: { name: "Brian Ochieng", phone: "0718114009" },
      fulfillment: "delivery",
      items: [{ productName: "Phone screen", quantity: 1 }],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("lets a guest check a saved order payment state without creating an account", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    const result = await caller.public.getOrderPaymentStatus({ reference: "DPH-ORD-102030405060708090A0B0C0" });
    expect(result?.paymentStatus).toBe("not_configured");
    expect(paymentMocks.getGuestOrderPaymentStatus).toHaveBeenCalledWith("DPH-ORD-102030405060708090A0B0C0");
  });

  it("accepts only an order reference and retry token for guest M-PESA initiation", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    const input = { reference: "DPH-ORD-102030405060708090A0B0C0", idempotencyKey: "102030405060708090A0B0C1" };
    await caller.public.startOrderPayment(input);
    expect(paymentMocks.startGuestOrderPayment).toHaveBeenCalledWith(input);
    await expect(caller.public.startOrderPayment({ ...input, amount: 1, phone: "254718114009" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.public.startOrderPayment({ ...input, reference: "DPH-ORD-timestamp" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("allows an owner to move a repair stage and add an operational note", async () => {
    const caller = appRouter.createCaller(contextFor(owner));
    await caller.admin.updateRepair({ id: 9, status: "diagnostics", technicianId: null });
    await caller.admin.addNote({ ticketId: 9, note: "Initial diagnostics started." });
    expect(dbMocks.updateRepairTicket).toHaveBeenCalledWith({ id: 9, status: "diagnostics", technicianId: null });
    expect(dbMocks.addRepairNote).toHaveBeenCalledWith({ ticketId: 9, note: "Initial diagnostics started.", authorId: 1 });
  });

  it("allows an owner to update inventory and process an order status", async () => {
    const caller = appRouter.createCaller(contextFor(owner));
    await caller.admin.upsertProduct({ sku: "DPH-TEST-001", name: "Test replacement part", category: "accessory", price: 1200, stock: 4 });
    await caller.admin.updateOrder({ id: 12, status: "confirmed" });
    expect(dbMocks.upsertProduct).toHaveBeenCalled();
    expect(dbMocks.updateOrderStatus).toHaveBeenCalledWith({ id: 12, status: "confirmed" });
  });

  it("allows an owner to maintain the technician roster", async () => {
    const caller = appRouter.createCaller(contextFor(owner));
    await caller.admin.allTechnicians();
    await caller.admin.upsertTechnician({ name: "Otieno Repair", specialty: "Phone diagnostics", active: true });
    expect(dbMocks.listAllTechnicians).toHaveBeenCalled();
    expect(dbMocks.upsertTechnician).toHaveBeenCalledWith({ name: "Otieno Repair", specialty: "Phone diagnostics", active: true });
  });

  it("rejects technician roster updates from non-admin users", async () => {
    const caller = appRouter.createCaller(contextFor(baseUser));
    await expect(caller.admin.upsertTechnician({ name: "Blocked User" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps customer records and inventory visibility behind the owner role", async () => {
    const ownerCaller = appRouter.createCaller(contextFor(owner));
    await ownerCaller.admin.customers();
    await ownerCaller.admin.setProductActive({ id: 17, active: true });
    expect(dbMocks.listCustomers).toHaveBeenCalled();
    expect(dbMocks.setProductActive).toHaveBeenCalledWith({ id: 17, active: true });

    const customerCaller = appRouter.createCaller(contextFor(baseUser));
    await expect(customerCaller.admin.customers()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(customerCaller.admin.setProductActive({ id: 17, active: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
