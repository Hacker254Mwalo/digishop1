import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  email: varchar("email", { length: 320 }),
  location: varchar("location", { length: 180 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const technicians = mysqlTable("technicians", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  specialty: varchar("specialty", { length: 160 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  type: mysqlEnum("type", ["phone", "laptop", "tablet", "other"]).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 160 }).notNull(),
  serialNumber: varchar("serialNumber", { length: 160 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const repairTickets = mysqlTable("repairTickets", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 32 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  deviceId: int("deviceId").notNull(),
  technicianId: int("technicianId"),
  issue: text("issue").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  status: mysqlEnum("status", ["received", "diagnostics", "awaiting_approval", "in_repair", "ready", "collected", "cancelled"]).default("received").notNull(),
  quotedAmount: int("quotedAmount"),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const repairNotes = mysqlTable("repairNotes", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  authorId: int("authorId"),
  note: text("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  category: mysqlEnum("category", ["phone_screen", "charging_port", "battery", "laptop_spare", "accessory", "other"]).notNull(),
  description: text("description"),
  compatibility: text("compatibility"),
  imageUrl: varchar("imageUrl", { length: 512 }),
  price: int("price").notNull(),
  stock: int("stock").default(0).notNull(),
  reorderLevel: int("reorderLevel").default(2).notNull(),
  availability: mysqlEnum("availability", ["in_stock", "low_stock", "out_of_stock", "by_order"]).default("in_stock").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderRequests = mysqlTable("orderRequests", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 32 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  status: mysqlEnum("status", ["new", "confirmed", "fulfilled", "cancelled"]).default("new").notNull(),
  fulfillment: mysqlEnum("fulfillment", ["delivery", "collection"]).notNull(),
  deliveryLocation: varchar("deliveryLocation", { length: 180 }),
  notes: text("notes"),
  total: int("total"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderRequestId: int("orderRequestId").notNull(),
  productId: int("productId"),
  productNameSnapshot: varchar("productNameSnapshot", { length: 180 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type RepairTicket = typeof repairTickets.$inferSelect;
export type RepairNote = typeof repairNotes.$inferSelect;
export type Technician = typeof technicians.$inferSelect;
export type Product = typeof products.$inferSelect;
export type OrderRequest = typeof orderRequests.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
