import { z } from "zod";

// User validation schemas
export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
  role: z.enum(["USER", "ADMIN"]).optional(),
  accountType: z.enum(["CHECKING", "SAVINGS", "BUSINESS"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  accountType: z.enum(["CHECKING", "SAVINGS", "BUSINESS"]).optional(),
  isActive: z.boolean().optional(),
});

// Transaction validation schemas
export const createTransactionSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  type: z.enum(["CREDIT", "DEBIT"]),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  reference: z.string().optional(),
});

// Admin validation schemas
export const adminUpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  balance: z.number().min(0).optional(),
  accountType: z.enum(["CHECKING", "SAVINGS", "BUSINESS"]).optional(),
  isActive: z.boolean().optional(),
});

export const adminUpdateBalanceSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  amount: z.number().positive("Amount must be positive"),
  action: z.enum(["ADD", "SUBTRACT"]),
  description: z.string().min(1, "Description is required"),
});

// Type exports for use in API
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminUpdateBalanceInput = z.infer<typeof adminUpdateBalanceSchema>;