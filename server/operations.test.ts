import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  addRepairNote: vi.fn().mockResolvedValue({ success: true }),
  createOrderRequest: vi.fn().mockResolvedValue({ reference: "DPH-ORD-TEST", total: 0 }),
  createRepairRequest: vi.fn().mockResolvedValue({ reference: "DPH-REP-TEST", status: "received" }),
  getDashboardSummary: vi.fn().mockResolvedValue({ newRepairs: 0, activeRepairs: 0, readyRepairs: 0, lowStock: 0, pendingOrders: 0 }),
  getRepairHistory: vi.fn().mockResolvedValue({ tickets: [], notes: [] }),
  getDb: vi.fn(),
  listOrderRequests: vi.fn().mockResolvedValue([]),
  listProducts: vi.fn().mockResolvedValue([]),
  listRepairTickets: vi.fn().mockResolvedValue([]),
  listTechnicians: vi.fn().mockResolvedValue([]),
  listAllTechnicians: vi.fn().mockResolvedValue([]),
  upsertTechnician: vi.fn().mockResolvedValue({ success: true }),
  updateOrderStatus: vi.fn().mockResolvedValue({ success: true }),
  updateRepairTicket: vi.fn().mockResolvedValue({ success: true }),
  upsertProduct: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type TestUser = NonNullable<TrpcContext["user"]>;

function contextFor(user: TestUser | null): TrpcContext {
  return {
    user,
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
    });
    expect(result.reference).toBe("DPH-REP-TEST");
    expect(dbMocks.createRepairRequest).toHaveBeenCalled();
  });

  it("creates a spare-part order request through the public contract", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    const result = await caller.public.createOrderRequest({
      customer: { name: "Brian Ochieng", phone: "0718114009" },
      fulfillment: "delivery",
      deliveryLocation: "Kisumu",
      items: [{ productName: "Phone screen", quantity: 1, unitPrice: 0 }],
    });
    expect(result.reference).toBe("DPH-ORD-TEST");
    expect(dbMocks.createOrderRequest).toHaveBeenCalled();
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
});
