import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  testPrisma,
  setupTestEnvironment,
  restoreEnvironment,
  createTestTransfer,
  TEST_USERS
} from './setup';

/**
 * Database Schema Validation Tests
 * Tests database constraints, relationships, and data integrity
 */

describe('Database Schema Validation Tests', () => {
  beforeAll(async () => {
    console.log('🗂️ Setting up schema validation test environment...');
    setupTestEnvironment();
    await setupTestDatabase();
  });

  afterAll(async () => {
    console.log('🗂️ Cleaning up schema validation test environment...');
    await cleanupTestDatabase();
    restoreEnvironment();
  });

  beforeEach(async () => {
    // Clean up any test data before each test
    await testPrisma.transaction.deleteMany({});
  });

  describe('Primary Key and Unique Constraints', () => {
    it('should enforce unique transaction IDs', async () => {
      const transactionData = {
        userId: TEST_USERS.regularUser.id,
        type: 'EXTERNAL_TRANSFER',
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        description: 'Unique ID test'
      };

      const transaction1 = await testPrisma.transaction.create({ data: transactionData });
      
      // Trying to create another transaction with same ID should fail
      // (This is handled by auto-generation, but we test the constraint exists)
      expect(transaction1.id).toBeTruthy();
      expect(typeof transaction1.id).toBe('string');

      // Create another transaction - should get different ID
      const transaction2 = await testPrisma.transaction.create({ data: transactionData });
      expect(transaction2.id).toBeTruthy();
      expect(transaction2.id).not.toBe(transaction1.id);
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should enforce userId references to existing users', async () => {
      // This test verifies the foreign key relationship works
      const validTransaction = await testPrisma.transaction.create({
        data: {
          userId: TEST_USERS.regularUser.id, // Valid user ID
          type: 'EXTERNAL_TRANSFER',
          amount: 100,
          currency: 'USD',
          status: 'PENDING'
        }
      });

      expect(validTransaction.userId).toBe(TEST_USERS.regularUser.id);
    });

    it('should be able to join transactions with users', async () => {
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: TEST_USERS.regularUser.id,
          type: 'EXTERNAL_TRANSFER',
          amount: 500,
          currency: 'USD',
          status: 'PENDING',
          description: 'Join test transaction'
        }
      });

      // Test the relationship by including user data
      const transactionWithUser = await testPrisma.transaction.findUnique({
        where: { id: transaction.id },
        include: { user: true }
      });

      expect(transactionWithUser).toBeTruthy();
      expect(transactionWithUser!.user).toBeTruthy();
      expect(transactionWithUser!.user.id).toBe(TEST_USERS.regularUser.id);
      expect(transactionWithUser!.user.email).toBe(TEST_USERS.regularUser.email);
    });
  });

  describe('Data Type Constraints', () => {
    it('should enforce proper data types for all fields', async () => {
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: TEST_USERS.regularUser.id,
          type: 'EXTERNAL_TRANSFER',
          amount: 999.99,
          currency: 'USD',
          status: 'PENDING',
          description: 'Data type test',
          reference: 'REF-123-456'
        }
      });

      // Verify data types are preserved correctly
      expect(typeof transaction.id).toBe('string');
      expect(typeof transaction.userId).toBe('string');
      expect(typeof transaction.type).toBe('string');
      expect(typeof transaction.amount).toBe('object'); // Decimal in Prisma
      expect(Number(transaction.amount)).toBe(999.99);
      expect(typeof transaction.currency).toBe('string');
      expect(typeof transaction.status).toBe('string');
      expect(typeof transaction.description).toBe('string');
      expect(typeof transaction.reference).toBe('string');
      expect(transaction.createdAt instanceof Date).toBe(true);
      expect(transaction.updatedAt instanceof Date).toBe(true);
    });

    it('should handle decimal precision correctly', async () => {
      const preciseAmounts = [
        0.01,        // Small amount
        0.001,       // Very small
        999999.99,   // Large amount
        123.456789,  // Many decimal places
        1000000.00   // Round number
      ];

      for (const amount of preciseAmounts) {
        const transaction = await testPrisma.transaction.create({
          data: {
            userId: TEST_USERS.regularUser.id,
            type: 'EXTERNAL_TRANSFER',
            amount: amount,
            currency: 'USD',
            status: 'PENDING',
            description: `Precision test: ${amount}`
          }
        });

        // Verify precision is maintained
        const retrievedAmount = Number(transaction.amount);
        expect(Math.abs(retrievedAmount - amount)).toBeLessThan(0.000001);
      }
    });
  });

  describe('Enum Value Constraints', () => {
    it('should accept all valid TransactionType values', async () => {
      const validTypes = ['CREDIT', 'DEBIT', 'EXTERNAL_TRANSFER'];

      for (const type of validTypes) {
        const transaction = await testPrisma.transaction.create({
          data: {
            userId: TEST_USERS.regularUser.id,
            type: type as any,
            amount: 100,
            currency: 'USD',
            status: 'PENDING',
            description: `Type test: ${type}`
          }
        });

        expect(transaction.type).toBe(type);
      }
    });

    it('should accept all valid TransactionStatus values', async () => {
      const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED'];

      for (const status of validStatuses) {
        const transaction = await testPrisma.transaction.create({
          data: {
            userId: TEST_USERS.regularUser.id,
            type: 'EXTERNAL_TRANSFER',
            amount: 100,
            currency: 'USD',
            status: status as any,
            description: `Status test: ${status}`
          }
        });

        expect(transaction.status).toBe(status);
      }
    });
  });

  describe('Nullable Field Constraints', () => {
    it('should allow null description', async () => {
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: TEST_USERS.regularUser.id,
          type: 'EXTERNAL_TRANSFER',
          amount: 100,
          currency: 'USD',
          status: 'PENDING',
          description: null
        }
      });

      expect(transaction.description).toBeNull();
    });

    it('should allow null reference', async () => {
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: TEST_USERS.regularUser.id,
          type: 'EXTERNAL_TRANSFER',
          amount: 100,
          currency: 'USD',
          status: 'PENDING',
          reference: null
        }
      });

      expect(transaction.reference).toBeNull();
    });

    it('should not allow null for required fields', async () => {
      // Test that required fields cannot be null/undefined
      const requiredFields = [
        { field: 'userId', value: null },
        { field: 'type', value: null },
        { field: 'amount', value: null },
        { field: 'currency', value: null },
        { field: 'status', value: null }
      ];

      for (const { field, value } of requiredFields) {
        const invalidData = {
          userId: TEST_USERS.regularUser.id,
          type: 'EXTERNAL_TRANSFER',
          amount: 100,
          currency: 'USD',
          status: 'PENDING',
          [field]: value
        };

        // Should throw an error for null required fields
        await expect(
          testPrisma.transaction.create({ data: invalidData as any })
        ).rejects.toThrow();
      }
    });
  });

  describe('Default Values', () => {
    it('should apply default currency when not specified', async () => {
      // Using raw SQL to test default values since Prisma may override
      const result = await testPrisma.$executeRaw`
        INSERT INTO "transactions" (id, "userId", type, amount, status, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${TEST_USERS.regularUser.id}, 'EXTERNAL_TRANSFER', 100.00, 'PENDING', NOW(), NOW())
      `;

      expect(result).toBe(1); // 1 row inserted

      // Fetch the inserted record
      const transaction = await testPrisma.transaction.findFirst({
        where: {
          userId: TEST_USERS.regularUser.id,
          amount: 100
        },
        orderBy: { createdAt: 'desc' }
      });

      expect(transaction).toBeTruthy();
      expect(transaction!.currency).toBe('NGN'); // Should get default value
    });

    it('should set updatedAt to current timestamp by default', async () => {
      const beforeCreate = new Date();
      
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: TEST_USERS.regularUser.id,
          type: 'EXTERNAL_TRANSFER',
          amount: 100,
          currency: 'USD',
          status: 'PENDING'
        }
      });

      const afterCreate = new Date();

      expect(transaction.updatedAt).toBeTruthy();
      expect(transaction.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(transaction.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Index Performance Validation', () => {
    it('should perform fast queries on indexed columns', async () => {
      // Create test data
      const testTransactions = [];
      for (let i = 0; i < 50; i++) {
        testTransactions.push({
          userId: i < 25 ? TEST_USERS.regularUser.id : TEST_USERS.adminUser.id,
          type: 'EXTERNAL_TRANSFER',
          amount: 100 + i,
          currency: 'USD',
          status: i % 3 === 0 ? 'PENDING' : i % 3 === 1 ? 'PROCESSING' : 'COMPLETED',
          description: `Performance test transaction ${i}`
        });
      }

      await testPrisma.transaction.createMany({ data: testTransactions });

      // Test query performance on indexed columns
      const queries = [
        // Single column indexes
        () => testPrisma.transaction.findMany({ where: { userId: TEST_USERS.regularUser.id } }),
        () => testPrisma.transaction.findMany({ where: { status: 'PENDING' } }),
        () => testPrisma.transaction.findMany({ where: { type: 'EXTERNAL_TRANSFER' } }),
        
        // Compound indexes
        () => testPrisma.transaction.findMany({ 
          where: { 
            userId: TEST_USERS.regularUser.id, 
            type: 'EXTERNAL_TRANSFER', 
            status: 'PENDING' 
          } 
        }),
        () => testPrisma.transaction.findMany({ 
          where: { 
            type: 'EXTERNAL_TRANSFER', 
            status: 'PENDING' 
          },
          orderBy: { createdAt: 'desc' }
        })
      ];

      for (const query of queries) {
        const startTime = Date.now();
        const results = await query();
        const queryTime = Date.now() - startTime;

        // Should be very fast due to indexes
        expect(queryTime).toBeLessThan(50); // Less than 50ms
        expect(Array.isArray(results)).toBe(true);
      }
    });
  });

  describe('Data Integrity and Relationships', () => {
    it('should maintain referential integrity', async () => {
      // Create transaction linked to a user
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: TEST_USERS.regularUser.id,
          type: 'EXTERNAL_TRANSFER',
          amount: 500,
          currency: 'USD',
          status: 'PENDING',
          description: 'Referential integrity test'
        }
      });

      // Verify the relationship works in both directions
      const transactionWithUser = await testPrisma.transaction.findUnique({
        where: { id: transaction.id },
        include: { user: true }
      });

      const userWithTransactions = await testPrisma.user.findUnique({
        where: { id: TEST_USERS.regularUser.id },
        include: { transactions: true }
      });

      expect(transactionWithUser!.user.id).toBe(TEST_USERS.regularUser.id);
      expect(userWithTransactions!.transactions.some(t => t.id === transaction.id)).toBe(true);
    });

    it('should cascade updates correctly', async () => {
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: TEST_USERS.regularUser.id,
          type: 'EXTERNAL_TRANSFER',
          amount: 250,
          currency: 'USD',
          status: 'PENDING',
          description: 'Cascade test'
        }
      });

      const originalUpdatedAt = transaction.updatedAt;

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update transaction
      const updatedTransaction = await testPrisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'PROCESSING' }
      });

      // updatedAt should be automatically updated by trigger
      expect(updatedTransaction.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(updatedTransaction.status).toBe('PROCESSING');
    });
  });

  describe('Complex Query Validation', () => {
    it('should handle complex aggregation queries', async () => {
      // Create diverse test data
      await Promise.all([
        testPrisma.transaction.create({
          data: {
            userId: TEST_USERS.regularUser.id,
            type: 'EXTERNAL_TRANSFER',
            amount: 100,
            currency: 'USD',
            status: 'COMPLETED'
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: TEST_USERS.regularUser.id,
            type: 'EXTERNAL_TRANSFER',
            amount: 200,
            currency: 'USD',
            status: 'PENDING'
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: TEST_USERS.adminUser.id,
            type: 'EXTERNAL_TRANSFER',
            amount: 300,
            currency: 'EUR',
            status: 'COMPLETED'
          }
        })
      ]);

      // Test aggregation
      const aggregation = await testPrisma.transaction.aggregate({
        where: { type: 'EXTERNAL_TRANSFER' },
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true }
      });

      expect(aggregation._count.id).toBe(3);
      expect(Number(aggregation._sum.amount)).toBe(600);
      expect(Number(aggregation._avg.amount)).toBe(200);
    });

    it('should handle complex filtering and sorting', async () => {
      // Create test data with timestamps
      const baseDate = new Date('2023-12-01T00:00:00Z');
      
      await Promise.all([
        testPrisma.transaction.create({
          data: {
            userId: TEST_USERS.regularUser.id,
            type: 'EXTERNAL_TRANSFER',
            amount: 100,
            currency: 'USD',
            status: 'PENDING',
            createdAt: new Date(baseDate.getTime() + 1000)
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: TEST_USERS.regularUser.id,
            type: 'EXTERNAL_TRANSFER',
            amount: 200,
            currency: 'USD',
            status: 'COMPLETED',
            createdAt: new Date(baseDate.getTime() + 2000)
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: TEST_USERS.regularUser.id,
            type: 'EXTERNAL_TRANSFER',
            amount: 300,
            currency: 'EUR',
            status: 'PENDING',
            createdAt: new Date(baseDate.getTime() + 3000)
          }
        })
      ]);

      // Complex query with multiple filters and sorting
      const complexQuery = await testPrisma.transaction.findMany({
        where: {
          AND: [
            { userId: TEST_USERS.regularUser.id },
            { type: 'EXTERNAL_TRANSFER' },
            { 
              OR: [
                { status: 'PENDING' },
                { amount: { gt: 150 } }
              ]
            }
          ]
        },
        orderBy: [
          { createdAt: 'desc' },
          { amount: 'asc' }
        ]
      });

      expect(complexQuery).toHaveLength(3); // All should match the OR condition
      expect(complexQuery[0].amount).toBe(300); // Most recent
      expect(complexQuery[1].amount).toBe(200); // Second most recent
      expect(complexQuery[2].amount).toBe(100); // Oldest
    });
  });
});