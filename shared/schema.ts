import { pgTable, text, serial, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "user" or "admin"
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  accountNumber: text("account_number").notNull(),
  accountType: text("account_type").notNull().default("checking"), // "checking", "savings", "business"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // "credit" or "debit"
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  reference: text("reference"), // Transaction reference number
  status: text("status").notNull().default("completed"), // "pending", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  targetUserId: integer("target_user_id").references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  accountNumber: true,
  lastLogin: true,
}).extend({
  confirmPassword: z.string().min(6),
  role: z.enum(["user", "admin"]).optional(),
  balance: z.string().optional(),
  accountType: z.enum(["checking", "savings", "business"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const fundManagementSchema = z.object({
  userId: z.number(),
  amount: z.number().min(0.01),
  action: z.enum(["add", "subtract"]),
  description: z.string().min(1),
});

export const editUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["user", "admin"]),
  accountType: z.enum(["checking", "savings", "business"]),
});

export const manualTransactionSchema = z.object({
  userId: z.number(),
  type: z.enum(["credit", "debit"]),
  amount: z.number().min(0.01),
  description: z.string().min(1),
  reference: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type FundManagement = z.infer<typeof fundManagementSchema>;
export type EditUser = z.infer<typeof editUserSchema>;
export type ManualTransaction = z.infer<typeof manualTransactionSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type AdminLog = typeof adminLogs.$inferSelect;
