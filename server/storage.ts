import { users, transactions, adminLogs, type User, type InsertUser, type Transaction, type AdminLog } from "@shared/schema";
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private adminLogs: Map<number, AdminLog>;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentAdminLogId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.adminLogs = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentAdminLogId = 1;
    
    // Create default admin user
    this.initializeDefaultUsers();
  }

  private generateAccountNumber(): string {
    return Math.random().toString().substr(2, 12);
  }

  private async initializeDefaultUsers() {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser: User = {
      id: this.currentUserId++,
      name: "System Administrator",
      email: "admin@primeedge.bank",
      password: hashedPassword,
      role: "admin",
      balance: "0.00",
      accountNumber: this.generateAccountNumber(),
      accountType: "business",
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(adminUser.id, adminUser);

    // Create a demo user
    const userHashedPassword = await bcrypt.hash("user123", 10);
    const demoUser: User = {
      id: this.currentUserId++,
      name: "John Doe",
      email: "john.doe@email.com",
      password: userHashedPassword,
      role: "user",
      balance: "12847.92",
      accountNumber: this.generateAccountNumber(),
      accountType: "checking",
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(demoUser.id, demoUser);

    // Add some demo transactions for the user
    const transactions = [
      {
        id: this.currentTransactionId++,
        userId: demoUser.id,
        type: "debit",
        amount: "89.99",
        description: "Amazon Purchase",
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed",
        createdAt: new Date(),
      },
      {
        id: this.currentTransactionId++,
        userId: demoUser.id,
        type: "credit",
        amount: "3500.00",
        description: "Salary Deposit",
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed",
        createdAt: new Date(Date.now() - 86400000), // Yesterday
      },
      {
        id: this.currentTransactionId++,
        userId: demoUser.id,
        type: "debit",
        amount: "1200.00",
        description: "Rent Payment",
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed",
        createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      },
    ];

    transactions.forEach(transaction => {
      this.transactions.set(transaction.id, transaction);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = this.currentUserId++;
    const user: User = {
      id,
      name: insertUser.name,
      email: insertUser.email,
      password: hashedPassword,
      role: insertUser.role || "user",
      balance: "0.00",
      accountNumber: this.generateAccountNumber(),
      accountType: "checking",
      createdAt: new Date(),
      lastLogin: null,
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, balance: newBalance });
    }
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, ...updates });
    }
  }

  async updateLastLogin(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, lastLogin: new Date() });
    }
  }

  async deleteUser(userId: number): Promise<void> {
    this.users.delete(userId);
    // Also delete user's transactions
    Array.from(this.transactions.entries()).forEach(([id, transaction]) => {
      if (transaction.userId === userId) {
        this.transactions.delete(id);
      }
    });
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAdminLog(log: Omit<AdminLog, 'id' | 'createdAt'>): Promise<AdminLog> {
    const id = this.currentAdminLogId++;
    const newLog: AdminLog = {
      ...log,
      id,
      createdAt: new Date(),
    };
    this.adminLogs.set(id, newLog);
    return newLog;
  }

  async getAdminLogs(): Promise<AdminLog[]> {
    return Array.from(this.adminLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDailyTransactionCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.createdAt >= today
    ).length;
  }

  async getTotalAssets(): Promise<number> {
    return Array.from(this.users.values()).reduce(
      (total, user) => total + parseFloat(user.balance), 0
    );
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

export const storage = new MemStorage();
