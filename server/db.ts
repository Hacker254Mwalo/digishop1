import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

type CustomerInput = { name: string; phone: string; email?: string; location?: string };
type DeviceInput = { type: "phone" | "laptop" | "tablet" | "electronics" | "other"; brand: string; model: string; serialNumber?: string; notes?: string };

let _db: SupabaseClient | null = null;

export async function getDb() {
  if (!_db && ENV.supabaseUrl && ENV.supabaseSecretKey) {
    _db = createClient(ENV.supabaseUrl, ENV.supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Supabase database is not available");
  return db;
}

function clean<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

async function one(request: PromiseLike<{ data: any; error: { message: string } | null }>): Promise<any> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Supabase returned no data");
  return data;
}

async function maybe(request: PromiseLike<{ data: any; error: { message: string } | null }>): Promise<any | null> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data ?? null;
}

async function many(request: PromiseLike<{ data: any[] | null; error: { message: string } | null }>): Promise<any[]> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertUser(user: { openId: string; name?: string | null; email?: string | null; loginMethod?: string | null; role?: "user" | "admin"; lastSignedIn?: Date }): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await requireDb();
  const payload = clean({ ...user, updatedAt: new Date(), lastSignedIn: user.lastSignedIn ?? new Date() });
  if (user.openId === ENV.ownerOpenId) payload.role = "admin";
  const { error } = await db.from("users").upsert(payload, { onConflict: "openId" });
  if (error) throw new Error(error.message);
}

export async function getUserByOpenId(openId: string) {
  const db = await requireDb();
  return maybe(db.from("users").select("*").eq("openId", openId).limit(1).maybeSingle());
}

export async function findOrCreateCustomer(input: CustomerInput) {
  const db = await requireDb();
  const existing = await maybe(db.from("customers").select("*").eq("phone", input.phone).limit(1).maybeSingle());
  if (existing) {
    // Guest contact details are unverified. Do not let a request using an existing
    // phone number overwrite another customer's saved name, email or location.
    return existing;
  }
  return one(db.from("customers").insert(clean(input)).select().single());
}

export async function createRepairRequest(input: { customer: CustomerInput; device: DeviceInput; issue: string; priority?: "low" | "normal" | "high" | "urgent"; submissionId?: string }) {
  const db = await requireDb();
  const submissionId = input.submissionId?.toUpperCase() ?? randomBytes(12).toString("hex").toUpperCase();
  const reference = `DPH-REP-${submissionId}`;
  const existingTicket = await maybe(db.from("repairTickets").select("id,reference").eq("reference", reference).limit(1).maybeSingle());
  if (existingTicket) return { reference, ticketId: existingTicket.id, existing: true };
  const customer = await findOrCreateCustomer(input.customer);
  // The existing production CHECK constraint does not include "electronics".
  // Preserve the broad category in notes while storing a schema-compatible type.
  const deviceType = input.device.type === "electronics" ? "other" : input.device.type;
  const device = await one(db.from("devices").insert({ customerId: customer.id, ...clean({ ...input.device, type: deviceType, notes: [input.device.notes, input.device.type === "electronics" ? "Customer selected electronics" : undefined].filter(Boolean).join(". ") || undefined }) }).select().single());
  try {
    const ticket = await one(db.from("repairTickets").insert({ reference, customerId: customer.id, deviceId: device.id, issue: input.issue, priority: input.priority ?? "normal" }).select().single());
    return { reference, ticketId: ticket.id, customerId: customer.id, deviceId: device.id, existing: false };
  } catch (error) {
    // If a concurrent retry won the unique-reference race, return its saved
    // request; otherwise remove the unlinked device created by this attempt.
    const duplicate = await maybe(db.from("repairTickets").select("id,reference").eq("reference", reference).limit(1).maybeSingle()).catch(() => null);
    if (duplicate) return { reference, ticketId: duplicate.id, existing: true };
    await db.from("devices").delete().eq("id", device.id);
    throw error;
  }
}

export async function createOrderRequest(input: { customer: CustomerInput; fulfillment: "delivery" | "collection"; deliveryLocation?: string; notes?: string; submissionId?: string; items: Array<{ productId?: number; productName: string; quantity: number; unitPrice?: number }> }) {
  const db = await requireDb();
  if (!input.items.length) throw new Error("At least one item is required");
  if (input.fulfillment === "delivery" && !input.deliveryLocation?.trim()) throw new Error("A delivery town or area is required");
  const submissionId = input.submissionId?.toUpperCase() ?? randomBytes(12).toString("hex").toUpperCase();
  const reference = `DPH-ORD-${submissionId}`;
  const existingOrder = await maybe(db.from("orderRequests").select("id,customerId,total").eq("reference", reference).limit(1).maybeSingle());
  if (existingOrder) return { reference, orderId: existingOrder.id, customerId: existingOrder.customerId, total: existingOrder.total, existing: true };
  const customer = await findOrCreateCustomer(input.customer);
  const productIds = input.items.map(item => item.productId).filter((id): id is number => typeof id === "number");
  const catalogProducts = productIds.length ? await many(db.from("products").select("id,name,price,availability,active,stock,productType,externalUrl").in("id", productIds)) : [];
  const requestedQuantities = new Map<number, number>();
  for (const item of input.items) if (item.productId) requestedQuantities.set(item.productId, (requestedQuantities.get(item.productId) ?? 0) + item.quantity);
  requestedQuantities.forEach((quantity, productId) => {
    const product = catalogProducts.find(row => row.id === productId);
    if (product && product.availability !== "by_order" && product.productType !== "service" && quantity > product.stock) throw new Error(`Product ${product.name} is no longer available in the requested quantity`);
  });
  const resolvedItems = input.items.map(item => {
    const catalogProduct = item.productId ? catalogProducts.find(product => product.id === item.productId) : null;
    if (item.productId && (!catalogProduct || !catalogProduct.active || catalogProduct.externalUrl || catalogProduct.availability === "out_of_stock" || (catalogProduct.availability !== "by_order" && catalogProduct.productType !== "service" && item.quantity > catalogProduct.stock))) throw new Error(`Product ${item.productName} is no longer available in the requested quantity`);
    return { ...item, productName: catalogProduct?.name ?? item.productName, unitPrice: catalogProduct?.price ?? 0 };
  });
  // Null means the desk must quote at least one line. Never record an unknown
  // customer-supplied price as a KES 0 sale or call this a paid checkout.
  const total = resolvedItems.some(item => item.unitPrice <= 0) ? null : resolvedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  let order: any;
  try {
    order = await one(db.from("orderRequests").insert({ reference, customerId: customer.id, fulfillment: input.fulfillment, deliveryLocation: input.fulfillment === "delivery" ? input.deliveryLocation?.trim() : null, notes: input.notes, total }).select().single());
  } catch (error) {
    const duplicate = await maybe(db.from("orderRequests").select("id,customerId,total").eq("reference", reference).limit(1).maybeSingle()).catch(() => null);
    if (duplicate) return { reference, orderId: duplicate.id, customerId: duplicate.customerId, total: duplicate.total, existing: true };
    throw error;
  }
  const items = resolvedItems.map(item => clean({ orderRequestId: order.id, productId: item.productId, productNameSnapshot: item.productName, quantity: item.quantity, unitPrice: item.unitPrice }));
  const { error } = await db.from("orderItems").insert(items);
  if (error) {
    // Best-effort cleanup avoids leaving a visible order with no item rows.
    await db.from("orderRequests").delete().eq("id", order.id);
    throw new Error(error.message);
  }
  return { reference, orderId: order.id, customerId: customer.id, total, existing: false };
}

async function countWhere(table: string, filters: Array<[string, string]>) {
  const db = await requireDb();
  let query = db.from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of filters) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getDashboardSummary() {
  const db = await requireDb();
  const [newRepairs, activeRows, awaitingApproval, readyRepairs, products, pendingOrders, activeTechnicians] = await Promise.all([
    countWhere("repairTickets", [["status", "received"]]),
    many(db.from("repairTickets").select("id,status").in("status", ["diagnostics", "awaiting_approval", "in_repair"])),
    countWhere("repairTickets", [["status", "awaiting_approval"]]),
    countWhere("repairTickets", [["status", "ready"]]),
    many(db.from("products").select("stock,reorderLevel").eq("active", true)),
    countWhere("orderRequests", [["status", "new"]]),
    countWhere("technicians", [["active", "true"]]),
  ]);
  return { newRepairs, activeRepairs: activeRows.length, awaitingApproval, readyRepairs, lowStock: products.filter(product => product.stock <= product.reorderLevel).length, pendingOrders, activeTechnicians };
}

export async function listRepairTickets() {
  const db = await requireDb();
  const tickets = await many(db.from("repairTickets").select("*").order("createdAt", { ascending: false }));
  const [customers, devices, technicians] = await Promise.all([
    many(db.from("customers").select("*")),
    many(db.from("devices").select("*")),
    many(db.from("technicians").select("*")),
  ]);
  return tickets.map(ticket => ({ ticket, customer: customers.find(customer => customer.id === ticket.customerId) ?? null, device: devices.find(device => device.id === ticket.deviceId) ?? null, technician: technicians.find(technician => technician.id === ticket.technicianId) ?? null }));
}

export async function getRepairStatus(reference: string) {
  const db = await requireDb();
  // The reference is a bearer token. Reveal only the operational stage and
  // timestamp, not the issue, quote, device, serial number or customer details.
  return maybe(db.from("repairTickets").select("reference,status,updatedAt").eq("reference", reference).limit(1).maybeSingle());
}

export async function getRepairHistory(input: { customerId: number; deviceId: number }) {
  const db = await requireDb();
  const tickets = await many(db.from("repairTickets").select("*").eq("customerId", input.customerId).eq("deviceId", input.deviceId).order("createdAt", { ascending: false }));
  const technicians = await many(db.from("technicians").select("*"));
  const ids = tickets.map(ticket => ticket.id);
  const notes = ids.length ? await many(db.from("repairNotes").select("*").in("ticketId", ids).order("createdAt", { ascending: false })) : [];
  return { tickets: tickets.map(ticket => ({ ticket, technician: technicians.find(technician => technician.id === ticket.technicianId) ?? null })), notes };
}

export async function listProducts() {
  const db = await requireDb();
  return many(db.from("products").select("*").eq("active", true).order("updatedAt", { ascending: false }));
}

export async function listAdminProducts() {
  const db = await requireDb();
  return many(db.from("products").select("*").order("updatedAt", { ascending: false }));
}

export async function listOrderRequests() {
  const db = await requireDb();
  const orders = await many(db.from("orderRequests").select("*").order("createdAt", { ascending: false }));
  const [customers, items] = await Promise.all([many(db.from("customers").select("*")), many(db.from("orderItems").select("*"))]);
  return orders.map(order => ({ order, customer: customers.find(customer => customer.id === order.customerId) ?? null, items: items.filter(item => item.orderRequestId === order.id) }));
}

export async function listCustomers() {
  const db = await requireDb();
  return many(db.from("customers").select("id,name,phone,email,location,createdAt,updatedAt").order("updatedAt", { ascending: false }));
}

export async function listTechnicians() {
  const db = await requireDb();
  return many(db.from("technicians").select("*").eq("active", true).order("name"));
}

export async function listAllTechnicians() {
  const db = await requireDb();
  return many(db.from("technicians").select("*").order("name"));
}

export async function upsertTechnician(input: { id?: number; name: string; phone?: string; specialty?: string; active?: boolean }) {
  const db = await requireDb();
  const values = clean({ name: input.name, phone: input.phone || null, specialty: input.specialty || null, active: input.active ?? true, updatedAt: new Date() });
  const result = input.id ? await db.from("technicians").update(values).eq("id", input.id).select("id").maybeSingle() : await db.from("technicians").insert(values).select("id").single();
  const { error } = result;
  if (error) throw new Error(error.message);
  if (!result.data) throw new Error("Technician record was not found");
  return { success: true } as const;
}

export async function updateRepairTicket(input: { id: number; status?: "received" | "diagnostics" | "awaiting_approval" | "in_repair" | "ready" | "collected" | "cancelled"; technicianId?: number | null; quotedAmount?: number | null }) {
  const db = await requireDb();
  const values = clean({ status: input.status, technicianId: input.technicianId, quotedAmount: input.quotedAmount, completedAt: input.status === "ready" || input.status === "collected" ? new Date() : undefined, updatedAt: new Date() });
  const { data, error } = await db.from("repairTickets").update(values).eq("id", input.id).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Repair ticket was not found");
  return { success: true } as const;
}

export async function addRepairNote(input: { ticketId: number; authorId: number; note: string }) {
  const db = await requireDb();
  const { error } = await db.from("repairNotes").insert(input);
  if (error) throw new Error(error.message);
  return { success: true } as const;
}

export async function uploadProductImage(input: { id: number; fileName: string; mimeType: "image/jpeg" | "image/png" | "image/webp"; base64: string }) {
  const bytes = Buffer.from(input.base64, "base64");
  if (!bytes.length) throw new Error("The selected image is empty");
  if (bytes.length > 6 * 1024 * 1024) throw new Error("Product images must be 6 MB or smaller");
  const extension = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
  const uploaded = await storagePut(`products/${input.id}/${Date.now()}.${extension}`, bytes, input.mimeType);
  const db = await requireDb();
  const { data, error } = await db.from("products").update({ imageUrl: uploaded.url, updatedAt: new Date() }).eq("id", input.id).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Product was not found");
  return { imageUrl: uploaded.url } as const;
}

export async function upsertProduct(input: { id?: number; sku: string; name: string; category: "phone_screen" | "charging_port" | "battery" | "laptop_spare" | "accessory" | "other"; productType?: "part" | "device" | "accessory" | "service"; description?: string; compatibility?: string; imageUrl?: string; externalUrl?: string; price: number; stock: number; reorderLevel?: number; availability?: "in_stock" | "low_stock" | "out_of_stock" | "by_order" }) {
  const db = await requireDb();
  const values = clean({ sku: input.sku, name: input.name, category: input.category, productType: input.productType ?? "part", description: input.description, compatibility: input.compatibility, imageUrl: input.imageUrl, externalUrl: input.externalUrl || null, price: input.price, stock: input.stock, reorderLevel: input.reorderLevel ?? 2, availability: input.availability ?? (input.stock > 2 ? "in_stock" : input.stock > 0 ? "low_stock" : "out_of_stock"), updatedAt: new Date() });
  if (input.id) {
    const { data, error } = await db.from("products").update(values).eq("id", input.id).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Product was not found");
    return { success: true, id: input.id } as const;
  }
  const { data, error } = await db.from("products").insert(values).select("id").single();
  if (error) throw new Error(error.message);
  return { success: true, id: data.id as number } as const;
}

export async function removeProduct(input: { id: number }) {
  const db = await requireDb();
  const { data, error } = await db.from("products").update({ active: false, updatedAt: new Date() }).eq("id", input.id).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Product was not found");
  return { success: true } as const;
}

export async function setProductActive(input: { id: number; active: boolean }) {
  const db = await requireDb();
  const { data, error } = await db.from("products").update({ active: input.active, updatedAt: new Date() }).eq("id", input.id).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Product was not found");
  return { success: true } as const;
}

export async function updateOrderStatus(input: { id: number; status: "new" | "confirmed" | "fulfilled" | "cancelled" }) {
  const db = await requireDb();
  const { data, error } = await db.from("orderRequests").update({ status: input.status, updatedAt: new Date() }).eq("id", input.id).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Order request was not found");
  return { success: true } as const;
}
