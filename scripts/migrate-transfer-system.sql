-- Migration script for clean transfer system
-- This script updates the existing Transaction table and enum types

-- Add new transaction type
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'EXTERNAL_TRANSFER';

-- Add new transaction statuses
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Update Transaction table structure
ALTER TABLE "transactions" 
  ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "amount" TYPE DECIMAL(65,30),
  ALTER COLUMN "description" DROP NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "transactions_userId_idx" ON "transactions" ("userId");
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions" ("status");
CREATE INDEX IF NOT EXISTS "transactions_type_idx" ON "transactions" ("type");

-- Create trigger to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transactions_updated_at ON "transactions";
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON "transactions"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration verification queries (run these after migration)
-- SELECT DISTINCT "type" FROM "transactions";
-- SELECT DISTINCT "status" FROM "transactions";
-- \d+ transactions