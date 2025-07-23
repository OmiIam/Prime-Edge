import { users, transactions, adminLogs, type User, type InsertUser, type Transaction, type AdminLog } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'confirmPassword'>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserBalance(userId: number, newBalance: string): Promise<void>;
  updateUser(userId: number, updates: Partial<User>): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;
  deleteUser(userId: number): Promise<void>;
  
  // Transaction operations
  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  
  // Admin log operations
  createAdminLog(log: Omit<AdminLog, 'id' | 'createdAt'>): Promise<AdminLog>;
  getAdminLogs(): Promise<AdminLog[]>;
  
  // Statistics
  getDailyTransactionCount(): Promise<number>;
  getTotalAssets(): Promise<number>;
  
  // Authentication
  validatePassword(password: string, hashedPassword: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const accountNumber = Math.random().toString().substr(2, 12);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        role: insertUser.role || "user",
        balance: "0.00",
        accountNumber,
        accountType: "checking",
        lastLogin: null,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<void> {
    await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId));
  }

  async updateLastLogin(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: number): Promise<void> {
    // Delete user's transactions first
    await db.delete(transactions).where(eq(transactions.userId, userId));
    // Delete admin logs related to this user
    await db.delete(adminLogs).where(eq(adminLogs.targetUserId, userId));
    // Delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        createdAt: new Date(),
      })
      .returning();
    return newTransaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(sql`${transactions.createdAt} DESC`);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(sql`${transactions.createdAt} DESC`);
  }

  async createAdminLog(log: Omit<AdminLog, 'id' | 'createdAt'>): Promise<AdminLog> {
    const [newLog] = await db
      .insert(adminLogs)
      .values({
        ...log,
        createdAt: new Date(),
      })
      .returning();
    return newLog;
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    return await db
      .select()
      .from(adminLogs)
      .orderBy(sql`${adminLogs.createdAt} DESC`);
  }

  async getDailyTransactionCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(gte(transactions.createdAt, today));
    
    return result[0]?.count || 0;
  }

  async getTotalAssets(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`sum(cast(${users.balance} as decimal))` })
      .from(users);
    
    return result[0]?.total || 0;
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

export const storage = new DatabaseStorage();