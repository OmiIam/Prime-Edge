import { db } from "./db";
import { users, transactions } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already seeded.");
      return;
    }

    // Generate account numbers
    const generateAccountNumber = () => Math.random().toString().substr(2, 12);

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db
      .insert(users)
      .values({
        name: "System Administrator",
        email: "admin@primeedge.bank",
        password: hashedAdminPassword,
        role: "admin",
        balance: "0.00",
        accountNumber: generateAccountNumber(),
        accountType: "business",
        lastLogin: null,
      })
      .returning();

    console.log("Created admin user:", adminUser.email);

    // Create demo user
    const hashedUserPassword = await bcrypt.hash("user123", 10);
    const [demoUser] = await db
      .insert(users)
      .values({
        name: "John Doe",
        email: "john.doe@email.com", 
        password: hashedUserPassword,
        role: "user",
        balance: "12847.92",
        accountNumber: generateAccountNumber(),
        accountType: "checking",
        lastLogin: null,
      })
      .returning();

    console.log("Created demo user:", demoUser.email);

    // Create demo transactions for the user
    const demoTransactions = [
      {
        userId: demoUser.id,
        type: "debit" as const,
        amount: "45.99",
        description: "Amazon Purchase",
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed" as const,
        createdAt: new Date(),
      },
      {
        userId: demoUser.id,
        type: "debit" as const,
        amount: "89.50",
        description: "Grocery Store",
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed" as const,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        userId: demoUser.id,
        type: "credit" as const,
        amount: "250.00",
        description: "Cash Deposit",
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed" as const,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      },
      {
        userId: demoUser.id,
        type: "debit" as const,
        amount: "1250.00",
        description: "Credit Card Payment",
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed" as const,
        createdAt: new Date(Date.now() - 43200000), // 12 hours ago
      },
      {
        userId: demoUser.id,
        type: "credit" as const,
        amount: "3500.00",
        description: "Salary Deposit",
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed" as const,
        createdAt: new Date(Date.now() - 86400000), // Yesterday
      },
      {
        userId: demoUser.id,
        type: "debit" as const,
        amount: "1200.00",
        description: "Rent Payment",
        reference: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: "completed" as const,
        createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      },
    ];

    await db.insert(transactions).values(demoTransactions);
    console.log(`Created ${demoTransactions.length} demo transactions`);

    console.log("Database seeded successfully!");
    console.log("Admin credentials: admin@primeedge.bank / admin123");
    console.log("User credentials: john.doe@email.com / user123");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });