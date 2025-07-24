import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, fundManagementSchema, editUserSchema, manualTransactionSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "prime-edge-banking-secret-key";

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Middleware to verify JWT token
const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Middleware to verify admin role
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration request body:", req.body);
      const validatedData = insertUserSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const { confirmPassword, ...userData } = validatedData;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          balance: user.balance,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await storage.validatePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login time
      await storage.updateLastLogin(user.id);

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          balance: user.balance,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User dashboard routes
  app.get("/api/dashboard", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const transactions = await storage.getUserTransactions(user.id);

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          balance: user.balance,
        },
        transactions: transactions.slice(0, 10), // Latest 10 transactions
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        createdAt: user.createdAt,
      }));
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:id/fund", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount, action, description } = fundManagementSchema.parse({
        ...req.body,
        userId,
      });

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      let newBalance: number;
      let transactionType: string;
      let transactionDescription: string;

      if (action === "add") {
        newBalance = currentBalance + amount;
        transactionType = "credit";
        transactionDescription = `Admin Credit: ${description}`;
      } else {
        newBalance = currentBalance - amount;
        if (newBalance < 0) {
          return res.status(400).json({ message: "Insufficient funds" });
        }
        transactionType = "debit";
        transactionDescription = `Admin Debit: ${description}`;
      }

      // Update user balance
      await storage.updateUserBalance(userId, newBalance.toFixed(2));

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: transactionType,
        amount: amount.toFixed(2),
        description: transactionDescription,
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed",
      });

      // Log admin action
      await storage.createAdminLog({
        adminId: req.user!.id,
        action: `${action}_funds`,
        targetUserId: userId,
        amount: amount.toFixed(2),
      });

      res.json({ message: "Fund operation completed successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(userId);

      // Log admin action
      await storage.createAdminLog({
        adminId: req.user!.id,
        action: "delete_user",
        targetUserId: userId,
        amount: null,
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/logs", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      const users = await storage.getAllUsers();
      
      const logsWithUserData = await Promise.all(logs.map(async log => {
        const admin = users.find(u => u.id === log.adminId);
        const targetUser = log.targetUserId ? users.find(u => u.id === log.targetUserId) : null;
        
        return {
          ...log,
          adminName: admin?.name || "Unknown Admin",
          targetUserName: targetUser?.name || null,
        };
      }));

      res.json(logsWithUserData);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Edit user profile
  app.post("/api/admin/users/:id/edit", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = editUserSchema.parse(req.body);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUser(userId, userData);

      // Log admin action
      await storage.createAdminLog({
        adminId: req.user!.id,
        action: "edit_user",
        targetUserId: userId,
        amount: null,
      });

      res.json({ message: "User updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user transactions (admin view)
  app.get("/api/admin/users/:id/transactions", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create manual transaction
  app.post("/api/admin/transactions", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const transactionData = manualTransactionSchema.parse(req.body);

      const user = await storage.getUser(transactionData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      let newBalance: number;

      if (transactionData.type === "credit") {
        newBalance = currentBalance + transactionData.amount;
      } else {
        newBalance = currentBalance - transactionData.amount;
        if (newBalance < 0) {
          return res.status(400).json({ message: "Insufficient funds" });
        }
      }

      // Create transaction
      await storage.createTransaction({
        userId: transactionData.userId,
        type: transactionData.type,
        amount: transactionData.amount.toFixed(2),
        description: transactionData.description,
        reference: transactionData.reference || `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed",
      });

      // Update user balance
      await storage.updateUserBalance(transactionData.userId, newBalance.toFixed(2));

      // Log admin action
      await storage.createAdminLog({
        adminId: req.user!.id,
        action: "manual_transaction",
        targetUserId: transactionData.userId,
        amount: transactionData.amount.toFixed(2),
      });

      res.json({ message: "Transaction created successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get admin statistics
  app.get("/api/admin/statistics", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const totalUsers = (await storage.getAllUsers()).length;
      const totalAssets = await storage.getTotalAssets();
      const dailyTransactions = await storage.getDailyTransactionCount();
      const totalTransactions = (await storage.getAllTransactions()).length;

      res.json({
        totalUsers,
        totalAssets,
        dailyTransactions,
        totalTransactions,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check endpoint for Railway
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Database seeding endpoint (for initial setup)
  app.post("/api/seed", async (req, res) => {
    try {
      const database = storage as any;
      if (!database.checkDb) {
        return res.status(500).json({ message: "Database not available" });
      }

      // Check if users already exist
      const existingUsers = await storage.getAllUsers();
      if (existingUsers.length > 0) {
        return res.json({ message: "Database already seeded", userCount: existingUsers.length });
      }

      // Create admin user
      const adminUser = await storage.createUser({
        email: "admin@primeedge.com",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        role: "admin"
      });

      // Create demo users
      const demoUser1 = await storage.createUser({
        email: "john.doe@email.com",
        password: "user123",
        firstName: "John",
        lastName: "Doe",
        role: "user"
      });

      const demoUser2 = await storage.createUser({
        email: "sarah.wilson@email.com",
        password: "user123",
        firstName: "Sarah",
        lastName: "Wilson",
        role: "user"
      });

      res.json({ 
        message: "Database seeded successfully",
        users: [
          { email: adminUser.email, role: adminUser.role },
          { email: demoUser1.email, role: demoUser1.role },
          { email: demoUser2.email, role: demoUser2.role }
        ]
      });
    } catch (error) {
      console.error("Seeding error:", error);
      res.status(500).json({ message: "Failed to seed database", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
