import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  customers,
  devices,
  InsertUser,
  orderItems,
  orderRequests,
  products,
  repairNotes,
  repairTickets,
  technicians,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb() {
  if (!_db) throw new Error("Database is not available");
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function findOrCreateCustomer(input: { name: string; phone: string; email?: string; location?: string }) {
  const db = requireDb();
  const existing = await db.select().from(customers).where(eq(customers.phone, input.phone)).limit(1);
  if (existing[0]) {
    await db.update(customers).set({ name: input.name, email: input.email ?? existing[0].email, location: input.location ?? existing[0].location }).where(eq(customers.id, existing[0].id));
    return existing[0];
  }
  const result = await db.insert(customers).values(input);
  const created = await db.select().from(customers).where(eq(customers.id, result[0].insertId)).limit(1);
  if (!created[0]) throw new Error("Customer could not be created");
  return created[0];
}

export async function createRepairRequest(input: {
  customer: { name: string; phone: string; email?: string; location?: string };
  device: { type: "phone" | "laptop" | "tablet" | "other"; brand: string; model: string; serialNumber?: string; notes?: string };
  issue: string;
  priority?: "low" | "normal" | "high" | "urgent";
}) {
  const db = requireDb();
  const customer = await findOrCreateCustomer(input.customer);
  const deviceResult = await db.insert(devices).values({ customerId: customer.id, ...input.device });
  const deviceRows = await db.select().from(devices).where(eq(devices.id, deviceResult[0].insertId)).limit(1);
  if (!deviceRows[0]) throw new Error("Device could not be created");
  const reference = `DPH-REP-${Date.now().toString(36).toUpperCase()}`;
  const ticketResult = await db.insert(repairTickets).values({ reference, customerId: customer.id, deviceId: deviceRows[0].id, issue: input.issue, priority: input.priority ?? "normal" });
  return { reference, ticketId: ticketResult[0].insertId, customerId: customer.id, deviceId: deviceRows[0].id };
}

export async function createOrderRequest(input: {
  customer: { name: string; phone: string; email?: string; location?: string };
  fulfillment: "delivery" | "collection";
  deliveryLocation?: string;
  notes?: string;
  items: Array<{ productId?: number; productName: string; quantity: number; unitPrice: number }>;
}) {
  const db = requireDb();
  if (!input.items.length) throw new Error("At least one item is required");
  const customer = await findOrCreateCustomer(input.customer);
  const total = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const reference = `DPH-ORD-${Date.now().toString(36).toUpperCase()}`;
  const orderResult = await db.insert(orderRequests).values({ reference, customerId: customer.id, fulfillment: input.fulfillment, deliveryLocation: input.deliveryLocation, notes: input.notes, total });
  const orderId = orderResult[0].insertId;
  await db.insert(orderItems).values(input.items.map(item => ({ orderRequestId: orderId, productId: item.productId, productNameSnapshot: item.productName, quantity: item.quantity, unitPrice: item.unitPrice })));
  return { reference, orderId, customerId: customer.id, total };
}

export async function getDashboardSummary() {
  const db = requireDb();
  const [newRepairs, activeRepairs, readyRepairs, lowStock, pendingOrders, activeTechnicians] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(repairTickets).where(eq(repairTickets.status, "received")),
    db.select({ count: sql<number>`count(*)` }).from(repairTickets).where(inArray(repairTickets.status, ["diagnostics", "awaiting_approval", "in_repair"])),
    db.select({ count: sql<number>`count(*)` }).from(repairTickets).where(eq(repairTickets.status, "ready")),
    db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.active, true), lte(products.stock, products.reorderLevel))),
    db.select({ count: sql<number>`count(*)` }).from(orderRequests).where(eq(orderRequests.status, "new")),
    db.select({ count: sql<number>`count(*)` }).from(technicians).where(eq(technicians.active, true)),
  ]);
  return { newRepairs: Number(newRepairs[0]?.count ?? 0), activeRepairs: Number(activeRepairs[0]?.count ?? 0), readyRepairs: Number(readyRepairs[0]?.count ?? 0), lowStock: Number(lowStock[0]?.count ?? 0), pendingOrders: Number(pendingOrders[0]?.count ?? 0), activeTechnicians: Number(activeTechnicians[0]?.count ?? 0) };
}

export async function listRepairTickets() {
  const db = requireDb();
  return db.select({ ticket: repairTickets, customer: customers, device: devices, technician: technicians }).from(repairTickets).leftJoin(customers, eq(repairTickets.customerId, customers.id)).leftJoin(devices, eq(repairTickets.deviceId, devices.id)).leftJoin(technicians, eq(repairTickets.technicianId, technicians.id)).orderBy(desc(repairTickets.createdAt));
}

export async function getRepairHistory(input: { customerId: number; deviceId: number }) {
  const db = requireDb();
  const tickets = await db.select({ ticket: repairTickets, technician: technicians }).from(repairTickets).leftJoin(technicians, eq(repairTickets.technicianId, technicians.id)).where(and(eq(repairTickets.customerId, input.customerId), eq(repairTickets.deviceId, input.deviceId))).orderBy(desc(repairTickets.createdAt));
  const ids = tickets.map(row => row.ticket.id);
  const notes = ids.length ? await db.select().from(repairNotes).where(inArray(repairNotes.ticketId, ids)).orderBy(desc(repairNotes.createdAt)) : [];
  return { tickets, notes };
}

export async function listProducts() {
  const db = requireDb();
  return db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.updatedAt));
}

export async function listOrderRequests() {
  const db = requireDb();
  const rows = await db.select({ order: orderRequests, customer: customers }).from(orderRequests).leftJoin(customers, eq(orderRequests.customerId, customers.id)).orderBy(desc(orderRequests.createdAt));
  const ids = rows.map(row => row.order.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderRequestId, ids)) : [];
  return rows.map(row => ({ ...row, items: items.filter(item => item.orderRequestId === row.order.id) }));
}

export async function listTechnicians() {
  const db = requireDb();
  return db.select().from(technicians).where(eq(technicians.active, true)).orderBy(technicians.name);
}

export async function listAllTechnicians() {
  const db = requireDb();
  return db.select().from(technicians).orderBy(technicians.name);
}

export async function upsertTechnician(input: { id?: number; name: string; phone?: string; specialty?: string; active?: boolean }) {
  const db = requireDb();
  const values = { name: input.name, phone: input.phone || null, specialty: input.specialty || null, active: input.active ?? true } as const;
  if (input.id) await db.update(technicians).set(values).where(eq(technicians.id, input.id));
  else await db.insert(technicians).values(values);
  return { success: true } as const;
}

export async function updateRepairTicket(input: { id: number; status?: "received" | "diagnostics" | "awaiting_approval" | "in_repair" | "ready" | "collected" | "cancelled"; technicianId?: number | null; quotedAmount?: number | null }) {
  const db = requireDb();
  await db.update(repairTickets).set({ status: input.status, technicianId: input.technicianId, quotedAmount: input.quotedAmount, completedAt: input.status === "ready" || input.status === "collected" ? new Date() : undefined }).where(eq(repairTickets.id, input.id));
  return { success: true } as const;
}

export async function addRepairNote(input: { ticketId: number; authorId: number; note: string }) {
  const db = requireDb();
  await db.insert(repairNotes).values(input);
  return { success: true } as const;
}

export async function upsertProduct(input: { id?: number; sku: string; name: string; category: "phone_screen" | "charging_port" | "battery" | "laptop_spare" | "accessory" | "other"; description?: string; compatibility?: string; price: number; stock: number; reorderLevel?: number; availability?: "in_stock" | "low_stock" | "out_of_stock" | "by_order" }) {
  const db = requireDb();
  const values = { sku: input.sku, name: input.name, category: input.category, description: input.description, compatibility: input.compatibility, price: input.price, stock: input.stock, reorderLevel: input.reorderLevel ?? 2, availability: input.availability ?? (input.stock > 2 ? "in_stock" : input.stock > 0 ? "low_stock" : "out_of_stock") } as const;
  if (input.id) await db.update(products).set(values).where(eq(products.id, input.id));
  else await db.insert(products).values(values);
  return { success: true } as const;
}

export async function updateOrderStatus(input: { id: number; status: "new" | "confirmed" | "fulfilled" | "cancelled" }) {
  const db = requireDb();
  await db.update(orderRequests).set({ status: input.status }).where(eq(orderRequests.id, input.id));
  return { success: true } as const;
}
