import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

import { 
  testPrisma,
  setupTestEnvironment,
  restoreEnvironment
} from './setup';

/**
 * Migration Script Execution Tests
 * Tests that the SQL migration script can be executed safely
 */

describe('Migration Script Execution Tests', () => {
  let migrationScript: string;

  beforeAll(async () => {
    console.log('📜 Setting up migration script test environment...');
    setupTestEnvironment();
    
    // Read the migration script
    const scriptPath = path.join(process.cwd(), 'scripts', 'migrate-transfer-system.sql');
    migrationScript = fs.readFileSync(scriptPath, 'utf8');
    
    console.log('📜 Migration script loaded successfully');
  });

  afterAll(async () => {
    console.log('📜 Cleaning up migration script test environment...');
    restoreEnvironment();
  });

  describe('Migration Script Validation', () => {
    it('should have a valid migration script file', () => {
      expect(migrationScript).toBeTruthy();
      expect(migrationScript.length).toBeGreaterThan(100);
      expect(migrationScript).toContain('EXTERNAL_TRANSFER');
      expect(migrationScript).toContain('PROCESSING');
      expect(migrationScript).toContain('REJECTED');
    });

    it('should contain proper SQL syntax', () => {
      // Check for required SQL constructs
      expect(migrationScript).toContain('ALTER TYPE');
      expect(migrationScript).toContain('ADD VALUE');
      expect(migrationScript).toContain('ALTER TABLE');
      expect(migrationScript).toContain('ADD COLUMN IF NOT EXISTS');
      expect(migrationScript).toContain('CREATE INDEX CONCURRENTLY IF NOT EXISTS');
      expect(migrationScript).toContain('CREATE OR REPLACE FUNCTION');
      expect(migrationScript).toContain('CREATE TRIGGER');
    });

    it('should use safe migration patterns', () => {
      // Check for safe migration practices
      expect(migrationScript).toContain('IF NOT EXISTS'); // Safe index creation
      expect(migrationScript).toContain('ADD COLUMN IF NOT EXISTS'); // Safe column addition
      expect(migrationScript).toContain('CONCURRENTLY'); // Safe concurrent index creation
      expect(migrationScript).toContain('DROP TRIGGER IF EXISTS'); // Safe trigger replacement
      
      // Should not contain dangerous operations
      expect(migrationScript).not.toContain('DROP TABLE');
      expect(migrationScript).not.toContain('DROP COLUMN');
      expect(migrationScript).not.toContain('TRUNCATE');
    });

    it('should handle enum additions safely', () => {
      // Check for safe enum value additions
      const enumAdditions = migrationScript.match(/ALTER TYPE.*ADD VALUE/gi);
      expect(enumAdditions).toBeTruthy();
      expect(enumAdditions!.length).toBeGreaterThanOrEqual(3); // At least 3 enum additions
      
      // Should check for existing values before adding
      expect(migrationScript).toContain('SELECT 1 FROM pg_enum');
      expect(migrationScript).toContain('WHERE enumlabel =');
    });
  });

  describe('Migration Script Components', () => {
    it('should add EXTERNAL_TRANSFER enum value safely', () => {
      const externalTransferBlock = migrationScript.match(/DO \$\$[\s\S]*?EXTERNAL_TRANSFER[\s\S]*?END \$\$/);
      expect(externalTransferBlock).toBeTruthy();
      expect(externalTransferBlock![0]).toContain('IF NOT EXISTS');
      expect(externalTransferBlock![0]).toContain('pg_enum');
      expect(externalTransferBlock![0]).toContain('TransactionType');
    });

    it('should add PROCESSING status safely', () => {
      const processingBlock = migrationScript.match(/DO \$\$[\s\S]*?PROCESSING[\s\S]*?END \$\$/);
      expect(processingBlock).toBeTruthy();
      expect(processingBlock![0]).toContain('IF NOT EXISTS');
      expect(processingBlock![0]).toContain('TransactionStatus');
    });

    it('should add REJECTED status safely', () => {
      const rejectedBlock = migrationScript.match(/DO \$\$[\s\S]*?REJECTED[\s\S]*?END \$\$/);
      expect(rejectedBlock).toBeTruthy();
      expect(rejectedBlock![0]).toContain('IF NOT EXISTS');
      expect(rejectedBlock![0]).toContain('TransactionStatus');
    });

    it('should include all required table modifications', () => {
      // Check for required column additions
      expect(migrationScript).toContain('ADD COLUMN IF NOT EXISTS "currency"');
      expect(migrationScript).toContain('ADD COLUMN IF NOT EXISTS "reference"');
      expect(migrationScript).toContain('ADD COLUMN IF NOT EXISTS "updatedAt"');
      
      // Check for column modifications
      expect(migrationScript).toContain('ALTER COLUMN "amount" TYPE DECIMAL');
      expect(migrationScript).toContain('ALTER COLUMN "description" DROP NOT NULL');
      expect(migrationScript).toContain('ALTER COLUMN "status" SET DEFAULT');
    });

    it('should include all required indexes', () => {
      const requiredIndexes = [
        'transactions_userId_idx',
        'transactions_status_idx',
        'transactions_type_idx',
        'transactions_userId_type_status_idx',
        'transactions_type_status_created_idx'
      ];

      requiredIndexes.forEach(indexName => {
        expect(migrationScript).toContain(indexName);
        expect(migrationScript).toContain('CREATE INDEX CONCURRENTLY IF NOT EXISTS');
      });
    });

    it('should include updatedAt trigger setup', () => {
      expect(migrationScript).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
      expect(migrationScript).toContain('RETURNS TRIGGER');
      expect(migrationScript).toContain('LANGUAGE plpgsql');
      expect(migrationScript).toContain('DROP TRIGGER IF EXISTS update_transactions_updated_at');
      expect(migrationScript).toContain('CREATE TRIGGER update_transactions_updated_at');
      expect(migrationScript).toContain('BEFORE UPDATE ON "transactions"');
    });

    it('should include data migration for existing records', () => {
      expect(migrationScript).toContain('UPDATE "transactions"');
      expect(migrationScript).toContain('SET "updatedAt" = "createdAt"');
      expect(migrationScript).toContain('WHERE "updatedAt" IS NULL');
    });
  });

  describe('Migration Script Safety Checks', () => {
    it('should not modify existing data destructively', () => {
      // Should not contain operations that would lose data
      const dangerousOperations = [
        'DELETE FROM',
        'TRUNCATE TABLE',
        'DROP COLUMN'
      ];

      dangerousOperations.forEach(operation => {
        const regex = new RegExp(operation, 'i');
        expect(migrationScript).not.toMatch(regex);
      });

      // Check for safe DROP NOT NULL (this is allowed as it makes column more permissive)
      if (migrationScript.includes('DROP NOT NULL')) {
        expect(migrationScript).toContain('ALTER COLUMN "description" DROP NOT NULL');
      }

      // Allow the specific updatedAt backfill update
      if (migrationScript.includes('SET "updatedAt"')) {
        expect(migrationScript).toContain('SET "updatedAt" = "createdAt"');
        expect(migrationScript).toContain('WHERE "updatedAt" IS NULL');
      }
    });

    it('should handle errors gracefully', () => {
      // Check for error handling in critical sections
      expect(migrationScript).toContain('EXCEPTION');
      expect(migrationScript).toContain('WHEN others THEN');
      expect(migrationScript).toContain('RAISE NOTICE');
    });

    it('should include verification queries as comments', () => {
      expect(migrationScript).toContain('-- Check enum values');
      expect(migrationScript).toContain('-- Check table structure');
      expect(migrationScript).toContain('-- Check indexes');
      expect(migrationScript).toContain('-- Test data integrity');
      
      // Verification queries should be commented out for safety
      expect(migrationScript).toContain('-- SELECT enumlabel FROM pg_enum');
      expect(migrationScript).toContain('-- \\d+ transactions');
      expect(migrationScript).toContain('-- SELECT indexname');
    });
  });

  describe('Migration Idempotency', () => {
    it('should be safe to run multiple times', async () => {
      // The migration script should be idempotent - safe to run multiple times
      // This is ensured by using IF NOT EXISTS clauses and safe operations
      
      // Test that enum checks work correctly
      const enumCheckPattern = /IF NOT EXISTS[\s\S]*?SELECT 1 FROM pg_enum/gi;
      const enumChecks = migrationScript.match(enumCheckPattern);
      expect(enumChecks).toBeTruthy();
      expect(enumChecks!.length).toBeGreaterThanOrEqual(3); // One for each enum value

      // Test that column additions are safe
      const columnAdditionPattern = /ADD COLUMN IF NOT EXISTS/gi;
      const columnAdditions = migrationScript.match(columnAdditionPattern);
      expect(columnAdditions).toBeTruthy();
      expect(columnAdditions!.length).toBeGreaterThanOrEqual(2); // Multiple column additions

      // Test that index creation is safe
      const indexCreationPattern = /CREATE INDEX CONCURRENTLY IF NOT EXISTS/gi;
      const indexCreations = migrationScript.match(indexCreationPattern);
      expect(indexCreations).toBeTruthy();
      expect(indexCreations!.length).toBeGreaterThanOrEqual(4); // Multiple indexes

      // Test that function replacement is safe
      expect(migrationScript).toContain('CREATE OR REPLACE FUNCTION');
      expect(migrationScript).toContain('DROP TRIGGER IF EXISTS');
    });

    it('should have proper transaction handling', () => {
      // Should end with COMMIT to ensure transaction completion
      expect(migrationScript.trim()).toMatch(/COMMIT;?\s*$/);
      
      // Should not have nested transactions that could cause issues
      const beginCount = (migrationScript.match(/BEGIN/gi) || []).length;
      const commitCount = (migrationScript.match(/COMMIT/gi) || []).length;
      
      // Should have proper transaction structure
      expect(commitCount).toBeGreaterThanOrEqual(1);
      
      // If there are explicit BEGINs, they should be matched with proper handling
      if (beginCount > 0) {
        expect(commitCount).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Migration Script Performance', () => {
    it('should use CONCURRENTLY for index creation', () => {
      // All index creations should be concurrent to avoid blocking
      const indexCreations = migrationScript.match(/CREATE INDEX.*ON "transactions"/gi) || [];
      
      indexCreations.forEach(indexCreation => {
        expect(indexCreation).toContain('CONCURRENTLY');
      });
      
      expect(indexCreations.length).toBeGreaterThan(0);
    });

    it('should use appropriate data types for performance', () => {
      // Currency should be TEXT (not VARCHAR with length limit)
      expect(migrationScript).toContain('"currency" TEXT');
      
      // Amount should be DECIMAL for precision
      expect(migrationScript).toContain('DECIMAL(65,30)');
      
      // Timestamps should have proper precision
      expect(migrationScript).toContain('TIMESTAMP(3)');
    });
  });
});