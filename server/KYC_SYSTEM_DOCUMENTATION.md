# Global KYC (Know Your Customer) Verification System

## Overview

This is a production-ready, secure, and scalable KYC verification system designed for global compliance. The system handles document uploads, identity verification, and admin review processes with GDPR-level privacy protection.

## Architecture

### Core Components

1. **Database Schema** (`kyc_requests` table)
   - User submission tracking
   - Document file references
   - Admin review workflow
   - Audit trail and compliance

2. **File Upload System** (`uploadMiddleware.ts`)
   - Secure file validation with magic byte checking
   - UUID-based filename generation
   - File size and type restrictions
   - Temporary file handling with cleanup

3. **Service Layer** (`kycService.ts`)
   - Database operations
   - Business logic
   - Risk scoring
   - GDPR compliance features

4. **API Controllers**
   - `kycController.ts` - User-facing operations
   - `adminKycController.ts` - Admin review operations

5. **Security & Validation**
   - Multi-layer input validation
   - Rate limiting
   - Suspicious activity detection
   - Geographic validation

## API Endpoints

### User Endpoints

#### Submit KYC Documents
```
POST /api/kyc/submit
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- documents: File[] (1-3 identity documents)
- selfie: File (1 face capture)
- fullName: string
- dateOfBirth: string (YYYY-MM-DD)
- countryOfResidence: string (ISO 2-letter)
- residentialAddress: string
- documentTypes: string[] (JSON array)
- deviceFingerprint: string (optional)

Response:
{
  "success": true,
  "message": "KYC documents submitted successfully",
  "data": {
    "requestId": "uuid",
    "status": "PENDING",
    "submittedAt": "ISO date",
    "documentsUploaded": 2,
    "estimatedReviewTime": "1-3 business days"
  }
}
```

#### Get KYC Status
```
GET /api/kyc/status
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "status": "PENDING|IN_REVIEW|APPROVED|REJECTED",
    "submittedAt": "ISO date",
    "reviewedAt": "ISO date|null",
    "rejectionReason": "string|null",
    "canResubmit": boolean,
    "documentsSubmitted": 2
  }
}
```

#### Download Own Documents (GDPR)
```
GET /api/kyc/document/{filename}
Authorization: Bearer {token}

Response: File download
```

#### Delete KYC Data (GDPR Right to be Forgotten)
```
DELETE /api/kyc/data
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "KYC data deleted successfully"
}
```

### Admin Endpoints

#### Get Pending Requests
```
GET /api/admin/kyc/pending?page=1&limit=10&status=PENDING
Authorization: Bearer {admin-token}

Response:
{
  "success": true,
  "data": {
    "requests": [...],
    "pagination": {...},
    "summary": {
      "pendingCount": 15,
      "inReviewCount": 8,
      "averageWaitTime": 2.3
    }
  }
}
```

#### Review KYC Request
```
PUT /api/admin/kyc/{requestId}/review
Authorization: Bearer {admin-token}

Body:
{
  "status": "APPROVED|REJECTED|REQUIRES_ADDITIONAL_INFO",
  "rejectionReason": "string (required if REJECTED)",
  "adminNotes": "string",
  "riskScore": 25,
  "complianceFlags": {...}
}

Response:
{
  "success": true,
  "message": "KYC request approved successfully",
  "data": {
    "requestId": "uuid",
    "newStatus": "APPROVED",
    "reviewedBy": "admin-uuid",
    "reviewedAt": "ISO date"
  }
}
```

#### Get Request Details
```
GET /api/admin/kyc/{requestId}
Authorization: Bearer {admin-token}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "user": {...},
    "documents": [...],
    "calculatedRiskScore": 15,
    "verificationChecks": {...},
    "timeline": {...}
  }
}
```

#### Download Document for Review
```
GET /api/admin/kyc/{requestId}/document/{filename}
Authorization: Bearer {admin-token}

Response: File download with audit logging
```

#### Bulk Operations
```
POST /api/admin/kyc/bulk-update
Authorization: Bearer {admin-token}

Body:
{
  "requestIds": ["uuid1", "uuid2"],
  "action": "APPROVE|REJECT|SET_IN_REVIEW",
  "data": {
    "rejectionReason": "string",
    "adminNotes": "string"
  }
}
```

#### Get Statistics
```
GET /api/admin/kyc/statistics
Authorization: Bearer {admin-token}

Response:
{
  "success": true,
  "data": {
    "totalRequests": 1250,
    "pendingRequests": 45,
    "approvedRequests": 1150,
    "rejectedRequests": 55,
    "avgProcessingTimeHours": 18.5,
    "performance": {
      "approvalRate": "92.0%",
      "rejectionRate": "4.4%"
    }
  }
}
```

## Security Features

### File Upload Security
- **File type validation**: Magic byte verification
- **Size limits**: 5MB per file, 4 files maximum
- **Filename security**: UUID-based naming prevents path traversal
- **Virus scanning ready**: Temporary directory for integration
- **Secure deletion**: DoD 5220.22-M standard file wiping

### Input Validation
- **Multi-layer validation**: Express-validator + custom checks
- **SQL injection protection**: Parameterized queries
- **XSS prevention**: Input sanitization
- **Age verification**: Must be 18+ years old
- **Country validation**: ISO 3166-1 alpha-2 codes
- **Suspicious pattern detection**: Automated flagging

### Rate Limiting
- **3 submissions per 24 hours per IP**
- **Admin bypass available**
- **Progressive penalties**

### Access Control
- **JWT-based authentication**
- **Role-based authorization** (USER/ADMIN)
- **Own data access only** (users can only access their KYC)
- **Admin audit logging**

## Database Schema

```sql
CREATE TABLE "kyc_requests" (
  "id" TEXT PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "selfie_path" TEXT,
  "full_name" TEXT NOT NULL,
  "date_of_birth" DATE NOT NULL,
  "country_of_residence" TEXT NOT NULL,
  "residential_address" TEXT NOT NULL,
  "document_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "submission_ip" TEXT,
  "device_fingerprint" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP,
  "rejection_reason" TEXT,
  "admin_notes" TEXT,
  "risk_score" INTEGER DEFAULT 0,
  "compliance_flags" JSONB DEFAULT '{}',
  "submitted_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT "kyc_requests_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "kyc_requests_reviewed_by_fkey" 
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL
);
```

## File Structure

```
server/
├── controllers/
│   ├── kycController.ts          # User KYC operations
│   └── adminKycController.ts     # Admin review operations
├── services/
│   └── kycService.ts            # Business logic & database
├── middleware/
│   ├── uploadMiddleware.ts      # Secure file upload
│   └── validation.ts           # Input validation
├── routes/
│   ├── kyc.ts                  # User KYC routes
│   └── admin/
│       └── kyc.ts              # Admin KYC routes
├── migrations/
│   └── add_kyc_requests.sql    # Database schema
└── uploads/
    ├── kyc/                    # Permanent document storage
    └── temp/                   # Temporary upload staging
```

## GDPR Compliance Features

### Data Subject Rights
- **Right to Access**: Users can download their documents
- **Right to Rectification**: Resubmission after rejection
- **Right to Erasure**: Secure document deletion
- **Data Portability**: Document download capability

### Privacy Protection
- **Data minimization**: Only collect necessary information
- **Purpose limitation**: Data used only for verification
- **Retention limits**: Configurable document lifecycle
- **Secure processing**: Encryption and access controls

### Audit Trail
- **Admin action logging**: All review decisions tracked
- **Access logging**: Document view tracking
- **Change history**: Status change timestamps
- **Compliance reporting**: Automated statistics

## Risk Assessment

The system includes automated risk scoring based on:

- **Age demographics** (very young/old = higher risk)
- **Geographic risk** (high-risk countries)
- **Data quality** (suspicious patterns, test data)
- **Account age** (new accounts = higher risk)
- **Document diversity** (multiple doc types = lower risk)

Risk scores range from 0-100 with thresholds for different review priorities.

## Production Deployment

### Environment Variables
```bash
DATABASE_URL="postgresql://..."
NODE_ENV="production"
AUTO_DELETE_REJECTED_DOCS="false"  # Set to "true" for auto-cleanup
```

### Directory Permissions
```bash
chmod 750 server/uploads/kyc
chmod 750 server/uploads/temp
```

### Database Migration
```bash
# Run the migration
psql $DATABASE_URL -f server/migrations/add_kyc_requests.sql
```

### Monitoring & Alerts
- **File system usage**: Monitor upload directory space
- **Processing times**: Alert on SLA breaches
- **Error rates**: Monitor failed submissions
- **Security events**: Suspicious activity alerts

## Integration Points

### Future Extensions
- **AML/PEP Screening**: Add sanctions list checking
- **Biometric Verification**: Face matching services
- **Document OCR**: Automated data extraction
- **Risk Intelligence**: Third-party risk scoring
- **Workflow Automation**: Advanced approval rules

### External Services
- **Email Notifications**: Status change alerts
- **SMS Verification**: Phone number verification
- **Identity Verification**: Third-party ID checks
- **Geolocation Services**: IP location validation

## Testing

### Unit Tests
- Service layer business logic
- Validation middleware
- Risk scoring algorithms

### Integration Tests
- API endpoint functionality
- File upload/download flows
- Database operations

### Security Tests
- File upload vulnerabilities
- Authentication/authorization
- Input validation bypasses
- Rate limiting effectiveness

## Support & Maintenance

### Log Monitoring
```bash
# Key log patterns to monitor
tail -f logs/app.log | grep "KYC"
tail -f logs/app.log | grep "Suspicious"
```

### Common Issues
1. **File upload failures**: Check disk space and permissions
2. **Database connection**: Monitor connection pool usage  
3. **Rate limiting**: Review IP whitelist configuration
4. **Document corruption**: Verify file integrity checksums

### Performance Optimization
- **Database indexing**: Monitor query performance
- **File storage**: Consider cloud storage migration
- **Caching**: Implement request result caching
- **Async processing**: Queue long-running operations

This KYC system is designed to handle global production workloads with enterprise-level security, compliance, and scalability requirements.