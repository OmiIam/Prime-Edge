-- KYC Requests Migration
-- This extends the existing schema to support a dedicated KYC requests table

-- Create KYC requests table with comprehensive tracking
CREATE TABLE IF NOT EXISTS "kyc_requests" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_ADDITIONAL_INFO')),
  
  -- Document file paths
  "documents" TEXT[] DEFAULT ARRAY[]::TEXT[], -- Up to 3 identity documents
  "selfie_path" TEXT,
  
  -- Personal Information
  "full_name" TEXT NOT NULL,
  "date_of_birth" DATE NOT NULL,
  "country_of_residence" TEXT NOT NULL,
  "residential_address" TEXT NOT NULL,
  
  -- Additional verification data
  "document_types" TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID']
  "submission_ip" TEXT,
  "device_fingerprint" TEXT,
  
  -- Review tracking
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP,
  "rejection_reason" TEXT,
  "admin_notes" TEXT,
  "risk_score" INTEGER DEFAULT 0,
  "compliance_flags" JSONB DEFAULT '{}',
  
  -- Timestamps
  "submitted_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT "kyc_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "kyc_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "kyc_requests_user_id_idx" ON "kyc_requests"("user_id");
CREATE INDEX IF NOT EXISTS "kyc_requests_status_idx" ON "kyc_requests"("status");
CREATE INDEX IF NOT EXISTS "kyc_requests_submitted_at_idx" ON "kyc_requests"("submitted_at");
CREATE INDEX IF NOT EXISTS "kyc_requests_reviewed_by_idx" ON "kyc_requests"("reviewed_by");

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kyc_requests_updated_at BEFORE UPDATE
    ON kyc_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE "kyc_requests" IS 'KYC verification requests with document uploads and admin review tracking';