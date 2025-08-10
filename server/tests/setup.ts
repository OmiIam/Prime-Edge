import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Test Database Setup and Utilities
 * Handles test database initialization, cleanup, and user seeding
 */

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

// Test JWT secret
export const TEST_JWT_SECRET = 'test-jwt-secret-for-automated-testing-only';

// Test user data
export const TEST_USERS = {
  regularUser: {
    id: 'test-user-regular',
    email: 'user@test.com',
    name: 'Test User',
    password: 'password123',
    role: 'USER',
    balance: 10000.00,
    isActive: true
  },
  adminUser: {
    id: 'test-user-admin',
    email: 'admin@test.com',
    name: 'Test Admin',
    password: 'admin123',
    role: 'ADMIN',
    balance: 50000.00,
    isActive: true
  },
  inactiveUser: {
    id: 'test-user-inactive',
    email: 'inactive@test.com',
    name: 'Inactive User',
    password: 'inactive123',
    role: 'USER',
    balance: 5000.00,
    isActive: false
  }
};

/**
 * Initialize test database with clean state
 */
export async function setupTestDatabase() {
  console.log('🔧 Setting up test database...');
  
  try {
    // Clean existing data
    await testPrisma.transaction.deleteMany();
    await testPrisma.user.deleteMany();
    
    // Hash passwords
    const hashedPasswordRegular = await bcrypt.hash(TEST_USERS.regularUser.password, 10);
    const hashedPasswordAdmin = await bcrypt.hash(TEST_USERS.adminUser.password, 10);
    const hashedPasswordInactive = await bcrypt.hash(TEST_USERS.inactiveUser.password, 10);
    
    // Create test users with upsert to handle conflicts
    await Promise.all([
      testPrisma.user.upsert({
        where: { id: TEST_USERS.regularUser.id },
        update: {
          ...TEST_USERS.regularUser,
          password: hashedPasswordRegular,
        },
        create: {
          ...TEST_USERS.regularUser,
          password: hashedPasswordRegular,
        }
      }),
      testPrisma.user.upsert({
        where: { id: TEST_USERS.adminUser.id },
        update: {
          ...TEST_USERS.adminUser,
          password: hashedPasswordAdmin,
        },
        create: {
          ...TEST_USERS.adminUser,
          password: hashedPasswordAdmin,
        }
      }),
      testPrisma.user.upsert({
        where: { id: TEST_USERS.inactiveUser.id },
        update: {
          ...TEST_USERS.inactiveUser,
          password: hashedPasswordInactive,
        },
        create: {
          ...TEST_USERS.inactiveUser,
          password: hashedPasswordInactive,
        }
      })
    ]);
    
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase() {
  console.log('🧹 Cleaning up test database...');
  
  try {
    await testPrisma.transaction.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.$disconnect();
    console.log('✅ Test database cleanup complete');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
    throw error;
  }
}

/**
 * Generate JWT token for testing
 */
export function generateTestToken(userId: string, email: string, role: string = 'USER'): string {
  return jwt.sign(
    { userId, email, role },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create test JWT tokens for all test users
 */
export const TEST_TOKENS = {
  regularUser: generateTestToken(
    TEST_USERS.regularUser.id,
    TEST_USERS.regularUser.email,
    TEST_USERS.regularUser.role
  ),
  adminUser: generateTestToken(
    TEST_USERS.adminUser.id,
    TEST_USERS.adminUser.email,
    TEST_USERS.adminUser.role
  ),
  inactiveUser: generateTestToken(
    TEST_USERS.inactiveUser.id,
    TEST_USERS.inactiveUser.email,
    TEST_USERS.inactiveUser.role
  )
};

/**
 * Create a sample transfer for testing
 */
export async function createTestTransfer(
  userId: string,
  overrides: Partial<any> = {}
): Promise<any> {
  return testPrisma.transaction.create({
    data: {
      userId,
      type: 'EXTERNAL_TRANSFER',
      amount: 1000.00,
      currency: 'USD',
      status: 'PENDING',
      description: 'Test transfer',
      metadata: {
        recipientInfo: {
          name: 'John Doe',
          accountNumber: '1234567890',
          bankCode: 'ABC123'
        },
        submittedAt: new Date().toISOString(),
        requiresApproval: true
      },
      ...overrides
    }
  });
}

/**
 * Wait for a specific condition with timeout
 */
export function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = async () => {
      try {
        if (await condition()) {
          resolve();
          return;
        }
        
        if (Date.now() - startTime >= timeout) {
          reject(new Error(`Condition not met within ${timeout}ms timeout`));
          return;
        }
        
        setTimeout(check, interval);
      } catch (error) {
        reject(error);
      }
    };
    
    check();
  });
}

/**
 * Mock environment variables for testing
 */
export function setupTestEnvironment() {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.MOCK_BANK_DELAY_MS = '100'; // Fast for testing
  process.env.NODE_ENV = 'test';
}

/**
 * Restore environment variables after testing
 */
export function restoreEnvironment() {
  delete process.env.JWT_SECRET;
  delete process.env.MOCK_BANK_DELAY_MS;
  delete process.env.NODE_ENV;
}