// Legacy schema file - re-exports from validation.ts for compatibility
export {
  createUserSchema as insertUserSchema,
  loginSchema,
  updateUserSchema as editUserSchema,
  createTransactionSchema as manualTransactionSchema,
  adminUpdateBalanceSchema as fundManagementSchema,
  type CreateUserInput as InsertUser,
  type LoginInput as LoginUser,
  type UpdateUserInput as EditUser,
  type CreateTransactionInput as ManualTransaction,
  type AdminUpdateBalanceInput as FundManagement,
} from './validation'

// Prisma types re-export
export type { User, Transaction, AdminLog, Role, AccountType, TransactionType, TransactionStatus } from '@prisma/client'