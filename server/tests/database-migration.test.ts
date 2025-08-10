import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  testPrisma,
  setupTestEnvironment,
  restoreEnvironment
} from './setup';

/**
 * Database Migration Tests
 * Tests the clean transfer system database migration script
 */

describe('Database Migration Tests', () => {
  beforeAll(async () => {
    console.log('🗄️ Setting up database migration test environment...');
    setupTestEnvironment();
    await setupTestDatabase();
  });

  afterAll(async () => {
    console.log('🗄️ Cleaning up database migration test environment...');
    await cleanupTestDatabase();
    restoreEnvironment();
  });

  beforeEach(async () => {
    // Clean up any test data before each test
    await testPrisma.transaction.deleteMany({});
  });

  describe('Enum Type Extensions', () => {
    it('should have EXTERNAL_TRANSFER in TransactionType enum', async () => {
      const result = await testPrisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionType')
        AND enumlabel = 'EXTERNAL_TRANSFER'
      `;

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect((result as any)[0].enumlabel).toBe('EXTERNAL_TRANSFER');
    });

    it('should have PROCESSING in TransactionStatus enum', async () => {
      const result = await testPrisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionStatus')
        AND enumlabel = 'PROCESSING'
      `;

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect((result as any)[0].enumlabel).toBe('PROCESSING');
    });

    it('should have REJECTED in TransactionStatus enum', async () => {
      const result = await testPrisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionStatus')
        AND enumlabel = 'REJECTED'
      `;

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect((result as any)[0].enumlabel).toBe('REJECTED');
    });

    it('should be able to create transaction with EXTERNAL_TRANSFER type', async () => {
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: 'test-user-1',
          type: 'EXTERNAL_TRANSFER',
          amount: 1000,
          currency: 'USD',
          status: 'PENDING',
          description: 'Migration test transaction'
        }
      });

      expect(transaction.type).toBe('EXTERNAL_TRANSFER');
      expect(transaction.status).toBe('PENDING');
    });

    it('should be able to create transaction with PROCESSING status', async () => {
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: 'test-user-1',
          type: 'EXTERNAL_TRANSFER',
          amount: 500,
          currency: 'USD',
          status: 'PROCESSING',
          description: 'Processing test transaction'
        }
      });

      expect(transaction.status).toBe('PROCESSING');
    });

    it('should be able to create transaction with REJECTED status', async () => {
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: 'test-user-1',
          type: 'EXTERNAL_TRANSFER',
          amount: 750,
          currency: 'USD',
          status: 'REJECTED',
          description: 'Rejected test transaction'
        }
      });

      expect(transaction.status).toBe('REJECTED');
    });
  });

  describe('Table Structure Validation', () => {
    it('should have currency column with proper type and default', async () => {
      const columnInfo = await testPrisma.$queryRaw`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'currency'
      `;

      expect(Array.isArray(columnInfo)).toBe(true);
      expect(columnInfo).toHaveLength(1);
      
      const column = (columnInfo as any)[0];
      expect(column.column_name).toBe('currency');
      expect(column.data_type).toBe('text');
      expect(column.column_default).toContain('USD'); // Should have default value
    });

    it('should have reference column', async () => {
      const columnInfo = await testPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'reference'
      `;

      expect(Array.isArray(columnInfo)).toBe(true);
      expect(columnInfo).toHaveLength(1);
      
      const column = (columnInfo as any)[0];
      expect(column.column_name).toBe('reference');
      expect(column.data_type).toBe('text');
      expect(column.is_nullable).toBe('YES');
    });

    it('should have updatedAt column with proper configuration', async () => {
      const columnInfo = await testPrisma.$queryRaw`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'updatedAt'
      `;

      expect(Array.isArray(columnInfo)).toBe(true);
      expect(columnInfo).toHaveLength(1);
      
      const column = (columnInfo as any)[0];
      expect(column.column_name).toBe('updatedAt');
      expect(column.data_type).toMatch(/timestamp/i);
      expect(column.column_default).toContain('CURRENT_TIMESTAMP');
    });

    it('should have amount column as decimal type', async () => {
      const columnInfo = await testPrisma.$queryRaw`
        SELECT column_name, data_type, numeric_precision, numeric_scale
        FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'amount'
      `;

      expect(Array.isArray(columnInfo)).toBe(true);
      expect(columnInfo).toHaveLength(1);
      
      const column = (columnInfo as any)[0];
      expect(column.column_name).toBe('amount');
      expect(column.data_type).toBe('numeric');
    });

    it('should have description column as nullable', async () => {
      const columnInfo = await testPrisma.$queryRaw`
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'transactions' AND column_name = 'description'
      `;

      expect(Array.isArray(columnInfo)).toBe(true);
      expect(columnInfo).toHaveLength(1);
      
      const column = (columnInfo as any)[0];
      expect(column.is_nullable).toBe('YES');
    });
  });

  describe('Database Indexes Validation', () => {
    it('should have userId index for performance', async () => {
      const indexExists = await testPrisma.$queryRaw`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'transactions' 
        AND indexname LIKE '%userId%'
      `;

      expect(Array.isArray(indexExists)).toBe(true);
      expect(indexExists.length).toBeGreaterThanOrEqual(1);
    });

    it('should have status index for filtering', async () => {
      const indexExists = await testPrisma.$queryRaw`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'transactions' 
        AND indexname LIKE '%status%'
      `;

      expect(Array.isArray(indexExists)).toBe(true);
      expect(indexExists.length).toBeGreaterThanOrEqual(1);
    });

    it('should have type index for transfer queries', async () => {
      const indexExists = await testPrisma.$queryRaw`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'transactions' 
        AND indexname LIKE '%type%'
      `;

      expect(Array.isArray(indexExists)).toBe(true);
      expect(indexExists.length).toBeGreaterThanOrEqual(1);
    });

    it('should have compound index for user transfer queries', async () => {
      const indexExists = await testPrisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'transactions' 
        AND indexname LIKE '%userId_type_status%'
      `;

      expect(Array.isArray(indexExists)).toBe(true);
      expect(indexExists.length).toBeGreaterThanOrEqual(1);
      
      // Verify the index includes all three columns
      const indexDef = (indexExists as any)[0]?.indexdef || '';
      expect(indexDef).toContain('userId');
      expect(indexDef).toContain('type');
      expect(indexDef).toContain('status');
    });

    it('should have compound index for admin pending queries', async () => {
      const indexExists = await testPrisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'transactions' 
        AND indexname LIKE '%type_status_created%'
      `;

      expect(Array.isArray(indexExists)).toBe(true);
      expect(indexExists.length).toBeGreaterThanOrEqual(1);
      
      // Verify the index includes type, status, and createdAt
      const indexDef = (indexExists as any)[0]?.indexdef || '';
      expect(indexDef).toContain('type');
      expect(indexDef).toContain('status');
      expect(indexDef).toContain('createdAt');
    });
  });

  describe('Database Triggers and Functions', () => {
    it('should have update_updated_at_column function', async () => {
      const functionExists = await testPrisma.$queryRaw`
        SELECT proname 
        FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
      `;

      expect(Array.isArray(functionExists)).toBe(true);
      expect(functionExists).toHaveLength(1);
      expect((functionExists as any)[0].proname).toBe('update_updated_at_column');
    });

    it('should have updatedAt trigger on transactions table', async () => {
      const triggerExists = await testPrisma.$queryRaw`
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'transactions' 
        AND trigger_name = 'update_transactions_updated_at'
      `;

      expect(Array.isArray(triggerExists)).toBe(true);
      expect(triggerExists).toHaveLength(1);
      expect((triggerExists as any)[0].trigger_name).toBe('update_transactions_updated_at');
    });

    it('should automatically update updatedAt on record modification', async () => {
      // Create initial transaction
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: 'test-user-1',
          type: 'EXTERNAL_TRANSFER',
          amount: 1000,
          currency: 'USD',
          status: 'PENDING',
          description: 'Trigger test transaction'
        }
      });

      const initialUpdatedAt = transaction.updatedAt;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update the transaction
      const updatedTransaction = await testPrisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'PROCESSING' }
      });

      // Verify updatedAt was automatically updated
      expect(updatedTransaction.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
      expect(updatedTransaction.status).toBe('PROCESSING');
    });
  });

  describe('Data Migration Validation', () => {
    it('should handle existing data without corruption', async () => {
      // Create some test data similar to what might exist before migration
      const transactions = await Promise.all([
        testPrisma.transaction.create({
          data: {
            userId: 'user-1',
            type: 'CREDIT',
            amount: 500,
            status: 'COMPLETED',
            description: 'Pre-migration deposit'
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: 'user-2',
            type: 'DEBIT',
            amount: 200,
            status: 'PENDING',
            description: 'Pre-migration withdrawal'
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: 'user-3',
            type: 'EXTERNAL_TRANSFER',
            amount: 1000,
            currency: 'USD',
            status: 'PROCESSING',
            description: 'Post-migration transfer'
          }
        })
      ]);

      // Verify all transactions exist and have proper structure
      const allTransactions = await testPrisma.transaction.findMany({
        orderBy: { createdAt: 'asc' }
      });

      expect(allTransactions).toHaveLength(3);
      
      // Check first transaction (pre-migration style)
      expect(allTransactions[0].type).toBe('CREDIT');
      expect(allTransactions[0].status).toBe('COMPLETED');
      expect(allTransactions[0].currency).toBe('NGN'); // Should get default value
      
      // Check second transaction
      expect(allTransactions[1].type).toBe('DEBIT');
      expect(allTransactions[1].status).toBe('PENDING');
      
      // Check third transaction (post-migration style)
      expect(allTransactions[2].type).toBe('EXTERNAL_TRANSFER');
      expect(allTransactions[2].status).toBe('PROCESSING');
      expect(allTransactions[2].currency).toBe('USD'); // Explicit currency
    });

    it('should handle null description values properly', async () => {
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: 'test-user-1',
          type: 'EXTERNAL_TRANSFER',
          amount: 100,
          currency: 'EUR',
          status: 'PENDING',
          description: null // Explicitly test null description
        }
      });

      expect(transaction.description).toBeNull();
      expect(transaction.currency).toBe('EUR');
      expect(transaction.type).toBe('EXTERNAL_TRANSFER');
    });

    it('should handle different currency values', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'NGN', 'CAD'];
      
      const transactions = await Promise.all(
        currencies.map(currency =>
          testPrisma.transaction.create({
            data: {
              userId: 'test-user-1',
              type: 'EXTERNAL_TRANSFER',
              amount: 100,
              currency,
              status: 'PENDING',
              description: `Test transaction in ${currency}`
            }
          })
        )
      );

      transactions.forEach((transaction, index) => {
        expect(transaction.currency).toBe(currencies[index]);
        expect(transaction.type).toBe('EXTERNAL_TRANSFER');
      });
    });
  });

  describe('Query Performance Validation', () => {
    it('should efficiently query user transfers by type and status', async () => {
      // Create test data
      await Promise.all([
        testPrisma.transaction.create({
          data: {
            userId: 'perf-user-1',
            type: 'EXTERNAL_TRANSFER',
            amount: 100,
            currency: 'USD',
            status: 'PENDING'
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: 'perf-user-1',
            type: 'EXTERNAL_TRANSFER',
            amount: 200,
            currency: 'USD',
            status: 'COMPLETED'
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: 'perf-user-2',
            type: 'EXTERNAL_TRANSFER',
            amount: 300,
            currency: 'USD',
            status: 'PENDING'
          }
        })
      ]);

      const startTime = Date.now();
      
      // Query that should use the compound index
      const userTransfers = await testPrisma.transaction.findMany({
        where: {
          userId: 'perf-user-1',
          type: 'EXTERNAL_TRANSFER',
          status: 'PENDING'
        }
      });

      const queryTime = Date.now() - startTime;

      // Should be very fast due to indexes
      expect(queryTime).toBeLessThan(100); // Less than 100ms
      expect(userTransfers).toHaveLength(1);
      expect(userTransfers[0].userId).toBe('perf-user-1');
      expect(userTransfers[0].status).toBe('PENDING');
    });

    it('should efficiently query admin pending transfers', async () => {
      // Create test data with different timestamps
      const now = new Date();
      await Promise.all([
        testPrisma.transaction.create({
          data: {
            userId: 'admin-user-1',
            type: 'EXTERNAL_TRANSFER',
            amount: 100,
            currency: 'USD',
            status: 'PENDING'
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: 'admin-user-2',
            type: 'EXTERNAL_TRANSFER',
            amount: 200,
            currency: 'USD',
            status: 'PENDING'
          }
        }),
        testPrisma.transaction.create({
          data: {
            userId: 'admin-user-3',
            type: 'EXTERNAL_TRANSFER',
            amount: 300,
            currency: 'USD',
            status: 'COMPLETED'
          }
        })
      ]);

      const startTime = Date.now();
      
      // Query that should use the admin compound index
      const pendingTransfers = await testPrisma.transaction.findMany({
        where: {
          type: 'EXTERNAL_TRANSFER',
          status: 'PENDING'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const queryTime = Date.now() - startTime;

      // Should be fast due to compound index
      expect(queryTime).toBeLessThan(100);
      expect(pendingTransfers).toHaveLength(2);
      expect(pendingTransfers.every(t => t.type === 'EXTERNAL_TRANSFER')).toBe(true);
      expect(pendingTransfers.every(t => t.status === 'PENDING')).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle large decimal amounts correctly', async () => {
      const largeAmount = 999999999.99;
      
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: 'large-amount-user',
          type: 'EXTERNAL_TRANSFER',
          amount: largeAmount,
          currency: 'USD',
          status: 'PENDING',
          description: 'Large amount test'
        }
      });

      expect(Number(transaction.amount)).toBe(largeAmount);
    });

    it('should handle very small decimal amounts correctly', async () => {
      const smallAmount = 0.01;
      
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: 'small-amount-user',
          type: 'EXTERNAL_TRANSFER',
          amount: smallAmount,
          currency: 'USD',
          status: 'PENDING',
          description: 'Small amount test'
        }
      });

      expect(Number(transaction.amount)).toBe(smallAmount);
    });

    it('should handle long description strings', async () => {
      const longDescription = 'This is a very long description that tests the ability of the database to handle lengthy text fields. '.repeat(10);
      
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: 'long-desc-user',
          type: 'EXTERNAL_TRANSFER',
          amount: 100,
          currency: 'USD',
          status: 'PENDING',
          description: longDescription
        }
      });

      expect(transaction.description).toBe(longDescription);
      expect(transaction.description!.length).toBeGreaterThan(500);
    });

    it('should handle special characters in reference field', async () => {
      const specialReference = 'REF-2023-12-01_#$%&@!';
      
      const transaction = await testPrisma.transaction.create({
        data: {
          userId: 'special-ref-user',
          type: 'EXTERNAL_TRANSFER',
          amount: 100,
          currency: 'USD',
          status: 'PENDING',
          reference: specialReference
        }
      });

      expect(transaction.reference).toBe(specialReference);
    });
  });
});