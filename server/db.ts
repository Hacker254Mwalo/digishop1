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
    return one(db.from("customers").update(clean({ name: input.name, email: input.email, location: input.location, updatedAt: new Date() })).eq("id", existing.id).select().single());
  }
  return one(db.from("customers").insert(clean(input)).select().single());
}

export async function createRepairRequest(input: { customer: CustomerInput; device: DeviceInput; issue: string; priority?: "low" | "normal" | "high" | "urgent" }) {
  const db = await requireDb();
  const customer = await findOrCreateCustomer(input.customer);
  const device = await one(db.from("devices").insert({ customerId: customer.id, ...clean(input.device) }).select().single());
  const reference = `DPH-REP-${Date.now().toString(36).toUpperCase()}`;
  const ticket = await one(db.from("repairTickets").insert({ reference, customerId: customer.id, deviceId: device.id, issue: input.issue, priority: input.priority ?? "normal" }).select().single());
  return { reference, ticketId: ticket.id, customerId: customer.id, deviceId: device.id };
}

export async function createOrderRequest(input: { customer: CustomerInput; fulfillment: "delivery" | "collection"; deliveryLocation?: string; notes?: string; items: Array<{ productId?: number; productName: string; quantity: number; unitPrice: number }> }) {
  const db = await requireDb();
  if (!input.items.length) throw new Error("At least one item is required");
  const customer = await findOrCreateCustomer(input.customer);
  const productIds = input.items.map(item => item.productId).filter((id): id is number => typeof id === "number");
  const catalogProducts = productIds.length ? await many(db.from("products").select("id,name,price,availability,active").in("id", productIds)) : [];
  const resolvedItems = input.items.map(item => {
    const catalogProduct = item.productId ? catalogProducts.find(product => product.id === item.productId) : null;
    if (item.productId && (!catalogProduct || !catalogProduct.active || catalogProduct.availability === "out_of_stock")) throw new Error(`Product ${item.productName} is no longer available`);
    return { ...item, productName: catalogProduct?.name ?? item.productName, unitPrice: catalogProduct?.price ?? 0 };
  });
  const total = resolvedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const reference = `DPH-ORD-${Date.now().toString(36).toUpperCase()}`;
  const order = await one(db.from("orderRequests").insert({ reference, customerId: customer.id, fulfillment: input.fulfillment, deliveryLocation: input.deliveryLocation, notes: input.notes, total }).select().single());
  const items = resolvedItems.map(item => clean({ orderRequestId: order.id, productId: item.productId, productNameSnapshot: item.productName, quantity: item.quantity, unitPrice: item.unitPrice }));
  const { error } = await db.from("orderItems").insert(items);
  if (error) throw new Error(error.message);
  return { reference, orderId: order.id, customerId: customer.id, total };
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
  const [newRepairs, activeRows, readyRepairs, products, pendingOrders, activeTechnicians] = await Promise.all([
    countWhere("repairTickets", [["status", "received"]]),
    many(db.from("repairTickets").select("id,status").in("status", ["diagnostics", "awaiting_approval", "in_repair"])),
    countWhere("repairTickets", [["status", "ready"]]),
    many(db.from("products").select("stock,reorderLevel").eq("active", true)),
    countWhere("orderRequests", [["status", "new"]]),
    countWhere("technicians", [["active", "true"]]),
  ]);
  return { newRepairs, activeRepairs: activeRows.length, readyRepairs, lowStock: products.filter(product => product.stock <= product.reorderLevel).length, pendingOrders, activeTechnicians };
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
  const ticket = await maybe(db.from("repairTickets").select("*").eq("reference", reference).limit(1).maybeSingle());
  if (!ticket) return null;
  const device = await maybe(db.from("devices").select("brand,model").eq("id", ticket.deviceId).limit(1).maybeSingle());
  return { reference: ticket.reference, status: ticket.status, issue: ticket.issue, device: device ? `${device.brand} ${device.model}` : "Device", receivedAt: ticket.receivedAt };
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

export async function listOrderRequests() {
  const db = await requireDb();
  const orders = await many(db.from("orderRequests").select("*").order("createdAt", { ascending: false }));
  const [customers, items] = await Promise.all([many(db.from("customers").select("*")), many(db.from("orderItems").select("*"))]);
  return orders.map(order => ({ order, customer: customers.find(customer => customer.id === order.customerId) ?? null, items: items.filter(item => item.orderRequestId === order.id) }));
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
  const { error } = input.id ? await db.from("technicians").update(values).eq("id", input.id) : await db.from("technicians").insert(values);
  if (error) throw new Error(error.message);
  return { success: true } as const;
}

export async function updateRepairTicket(input: { id: number; status?: "received" | "diagnostics" | "awaiting_approval" | "in_repair" | "ready" | "collected" | "cancelled"; technicianId?: number | null; quotedAmount?: number | null }) {
  const db = await requireDb();
  const values = clean({ status: input.status, technicianId: input.technicianId, quotedAmount: input.quotedAmount, completedAt: input.status === "ready" || input.status === "collected" ? new Date() : undefined, updatedAt: new Date() });
  const { error } = await db.from("repairTickets").update(values).eq("id", input.id);
  if (error) throw new Error(error.message);
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
  const { error } = await db.from("products").update({ imageUrl: uploaded.url, updatedAt: new Date() }).eq("id", input.id);
  if (error) throw new Error(error.message);
  return { imageUrl: uploaded.url } as const;
}

export async function upsertProduct(input: { id?: number; sku: string; name: string; category: "phone_screen" | "charging_port" | "battery" | "laptop_spare" | "accessory" | "other"; description?: string; compatibility?: string; imageUrl?: string; price: number; stock: number; reorderLevel?: number; availability?: "in_stock" | "low_stock" | "out_of_stock" | "by_order" }) {
  const db = await requireDb();
  const values = clean({ sku: input.sku, name: input.name, category: input.category, description: input.description, compatibility: input.compatibility, imageUrl: input.imageUrl, price: input.price, stock: input.stock, reorderLevel: input.reorderLevel ?? 2, availability: input.availability ?? (input.stock > 2 ? "in_stock" : input.stock > 0 ? "low_stock" : "out_of_stock"), updatedAt: new Date() });
  if (input.id) {
    const { error } = await db.from("products").update(values).eq("id", input.id);
    if (error) throw new Error(error.message);
    return { success: true, id: input.id } as const;
  }
  const { data, error } = await db.from("products").insert(values).select("id").single();
  if (error) throw new Error(error.message);
  return { success: true, id: data.id as number } as const;
}

export async function removeProduct(input: { id: number }) {
  const db = await requireDb();
  const { error } = await db.from("products").update({ active: false, availability: "out_of_stock", updatedAt: new Date() }).eq("id", input.id);
  if (error) throw new Error(error.message);
  return { success: true } as const;
}

export async function updateOrderStatus(input: { id: number; status: "new" | "confirmed" | "fulfilled" | "cancelled" }) {
  const db = await requireDb();
  const { error } = await db.from("orderRequests").update({ status: input.status, updatedAt: new Date() }).eq("id", input.id);
  if (error) throw new Error(error.message);
  return { success: true } as const;
}
