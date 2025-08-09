-- Migration: Add Clean Transfer System Support
-- This script updates the database schema to support the new transfer system
-- Run this against your PostgreSQL database before deploying the new code

-- Add EXTERNAL_TRANSFER to TransactionType enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'EXTERNAL_TRANSFER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionType')
    ) THEN
        ALTER TYPE "TransactionType" ADD VALUE 'EXTERNAL_TRANSFER';
    END IF;
END $$;

-- Add PROCESSING status to TransactionStatus enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PROCESSING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionStatus')
    ) THEN
        ALTER TYPE "TransactionStatus" ADD VALUE 'PROCESSING';
    END IF;
END $$;

-- Add REJECTED status to TransactionStatus enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'REJECTED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionStatus')
    ) THEN
        ALTER TYPE "TransactionStatus" ADD VALUE 'REJECTED';
    END IF;
END $$;

-- Update transactions table structure
-- Add currency column if it doesn't exist
ALTER TABLE "transactions" 
ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';

-- Add reference column if it doesn't exist  
ALTER TABLE "transactions" 
ADD COLUMN IF NOT EXISTS "reference" TEXT;

-- Ensure amount column is Decimal type
-- Note: This will preserve existing data
DO $$
BEGIN
    BEGIN
        ALTER TABLE "transactions" ALTER COLUMN "amount" TYPE DECIMAL(65,30);
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Column amount type conversion skipped or failed: %', SQLERRM;
    END;
END $$;

-- Make description nullable if it isn't already
ALTER TABLE "transactions" ALTER COLUMN "description" DROP NOT NULL;

-- Update default status to PENDING if it's currently COMPLETED
ALTER TABLE "transactions" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Add updatedAt column if it doesn't exist
ALTER TABLE "transactions" 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS "transactions_userId_idx" ON "transactions" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "transactions_status_idx" ON "transactions" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "transactions_type_idx" ON "transactions" ("type");

-- Create compound index for external transfer queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "transactions_userId_type_status_idx" 
ON "transactions" ("userId", "type", "status");

-- Create index for admin pending transfer queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "transactions_type_status_created_idx" 
ON "transactions" ("type", "status", "createdAt");

-- Create or replace function to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_transactions_updated_at ON "transactions";
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON "transactions"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have updatedAt = createdAt if updatedAt is null
UPDATE "transactions" 
SET "updatedAt" = "createdAt" 
WHERE "updatedAt" IS NULL;

-- Migration verification queries
-- Uncomment these to verify the migration worked correctly:

-- Check enum values
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionType') ORDER BY enumlabel;
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionStatus') ORDER BY enumlabel;

-- Check table structure
-- \d+ transactions

-- Check indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'transactions' ORDER BY indexname;

-- Test data integrity
-- SELECT COUNT(*) as total_transactions FROM "transactions";
-- SELECT COUNT(*) as external_transfers FROM "transactions" WHERE "type" = 'EXTERNAL_TRANSFER';
-- SELECT "status", COUNT(*) FROM "transactions" GROUP BY "status" ORDER BY "status";

COMMIT;