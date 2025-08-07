import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { secureDeleteFile } from '../middleware/uploadMiddleware';

// Database connection
const prisma = new PrismaClient();

// Enhanced interfaces for type safety
export interface KycSubmissionData {
  userId: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD format
  countryOfResidence: string;
  residentialAddress: string;
  documentPaths: string[];
  selfiePath: string;
  documentTypes: string[];
  submissionIp?: string;
  deviceFingerprint?: string;
}

export interface KycRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_ADDITIONAL_INFO';
  documents: string[];
  selfiePath: string | null;
  fullName: string;
  dateOfBirth: Date;
  countryOfResidence: string;
  residentialAddress: string;
  documentTypes: string[];
  submissionIp: string | null;
  deviceFingerprint: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  riskScore: number;
  complianceFlags: any;
  submittedAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    country: string | null;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface KycReviewData {
  adminId: string;
  status: 'APPROVED' | 'REJECTED' | 'REQUIRES_ADDITIONAL_INFO';
  rejectionReason?: string;
  adminNotes?: string;
  riskScore?: number;
  complianceFlags?: any;
}

export class KycService {
  // Submit new KYC request
  static async submitKycRequest(data: KycSubmissionData): Promise<{ success: boolean; requestId?: string; message: string }> {
    try {
      // Check if user already has a pending or approved request
      const existingRequest = await prisma.$queryRaw<any[]>`
        SELECT id, status FROM kyc_requests 
        WHERE user_id = ${data.userId} 
        AND status IN ('PENDING', 'IN_REVIEW', 'APPROVED')
        ORDER BY submitted_at DESC 
        LIMIT 1
      `;

      if (existingRequest.length > 0) {
        const existing = existingRequest[0];
        if (existing.status === 'APPROVED') {
          return {
            success: false,
            message: 'KYC verification already completed for this account'
          };
        } else {
          return {
            success: false,
            message: 'KYC request already pending. Please wait for review completion.'
          };
        }
      }

      // Validate date of birth
      const dob = new Date(data.dateOfBirth);
      if (isNaN(dob.getTime())) {
        return {
          success: false,
          message: 'Invalid date of birth format'
        };
      }

      // Calculate age (must be 18+)
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        return {
          success: false,
          message: 'Must be 18 years or older to verify identity'
        };
      }

      // Create KYC request
      const requestId = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO kyc_requests (
          user_id, status, documents, selfie_path, full_name, 
          date_of_birth, country_of_residence, residential_address,
          document_types, submission_ip, device_fingerprint, submitted_at
        ) VALUES (
          ${data.userId}, 'PENDING', ${data.documentPaths}, ${data.selfiePath},
          ${data.fullName}, ${data.dateOfBirth}, ${data.countryOfResidence},
          ${data.residentialAddress}, ${data.documentTypes}, 
          ${data.submissionIp || null}, ${data.deviceFingerprint || null}, NOW()
        ) RETURNING id
      `;

      // Update user KYC status
      await prisma.user.update({
        where: { id: data.userId },
        data: { 
          kycStatus: 'PENDING',
          updatedAt: new Date()
        }
      });

      // Log security event
      await prisma.securityEvent.create({
        data: {
          userId: data.userId,
          eventType: 'DOCUMENT_UPLOADED',
          description: 'KYC documents submitted for verification',
          ipAddress: data.submissionIp || undefined,
          riskLevel: 'LOW',
          metadata: {
            documentCount: data.documentPaths.length,
            documentTypes: data.documentTypes,
            country: data.countryOfResidence
          }
        }
      });

      return {
        success: true,
        requestId: requestId[0]?.id,
        message: 'KYC documents submitted successfully. Review typically takes 1-3 business days.'
      };

    } catch (error) {
      console.error('KYC submission error:', error);
      return {
        success: false,
        message: 'Failed to submit KYC request. Please try again.'
      };
    }
  }

  // Get user's KYC status and request details
  static async getUserKycStatus(userId: string): Promise<KycRequest | null> {
    try {
      const results = await prisma.$queryRaw<any[]>`
        SELECT 
          kr.*,
          u.name as user_name,
          u.email as user_email,
          u.country as user_country,
          reviewer.name as reviewer_name,
          reviewer.email as reviewer_email
        FROM kyc_requests kr
        JOIN users u ON kr.user_id = u.id
        LEFT JOIN users reviewer ON kr.reviewed_by = reviewer.id
        WHERE kr.user_id = ${userId}
        ORDER BY kr.submitted_at DESC
        LIMIT 1
      `;

      if (results.length === 0) return null;

      const result = results[0];
      return {
        id: result.id,
        userId: result.user_id,
        status: result.status,
        documents: result.documents,
        selfiePath: result.selfie_path,
        fullName: result.full_name,
        dateOfBirth: result.date_of_birth,
        countryOfResidence: result.country_of_residence,
        residentialAddress: result.residential_address,
        documentTypes: result.document_types,
        submissionIp: result.submission_ip,
        deviceFingerprint: result.device_fingerprint,
        reviewedBy: result.reviewed_by,
        reviewedAt: result.reviewed_at,
        rejectionReason: result.rejection_reason,
        adminNotes: result.admin_notes,
        riskScore: result.risk_score,
        complianceFlags: result.compliance_flags,
        submittedAt: result.submitted_at,
        updatedAt: result.updated_at,
        user: {
          id: result.user_id,
          name: result.user_name,
          email: result.user_email,
          country: result.user_country
        },
        reviewer: result.reviewer_name ? {
          id: result.reviewed_by,
          name: result.reviewer_name,
          email: result.reviewer_email
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      return null;
    }
  }

  // Admin: Get all pending KYC requests
  static async getPendingKycRequests(): Promise<KycRequest[]> {
    try {
      const results = await prisma.$queryRaw<any[]>`
        SELECT 
          kr.*,
          u.name as user_name,
          u.email as user_email,
          u.country as user_country,
          u.created_at as user_created_at
        FROM kyc_requests kr
        JOIN users u ON kr.user_id = u.id
        WHERE kr.status IN ('PENDING', 'IN_REVIEW')
        ORDER BY kr.submitted_at ASC
      `;

      return results.map(result => ({
        id: result.id,
        userId: result.user_id,
        status: result.status,
        documents: result.documents,
        selfiePath: result.selfie_path,
        fullName: result.full_name,
        dateOfBirth: result.date_of_birth,
        countryOfResidence: result.country_of_residence,
        residentialAddress: result.residential_address,
        documentTypes: result.document_types,
        submissionIp: result.submission_ip,
        deviceFingerprint: result.device_fingerprint,
        reviewedBy: result.reviewed_by,
        reviewedAt: result.reviewed_at,
        rejectionReason: result.rejection_reason,
        adminNotes: result.admin_notes,
        riskScore: result.risk_score,
        complianceFlags: result.compliance_flags,
        submittedAt: result.submitted_at,
        updatedAt: result.updated_at,
        user: {
          id: result.user_id,
          name: result.user_name,
          email: result.user_email,
          country: result.user_country
        }
      }));
    } catch (error) {
      console.error('Error fetching pending KYC requests:', error);
      return [];
    }
  }

  // Admin: Get specific KYC request by ID
  static async getKycRequestById(requestId: string): Promise<KycRequest | null> {
    try {
      const results = await prisma.$queryRaw<any[]>`
        SELECT 
          kr.*,
          u.name as user_name,
          u.email as user_email,
          u.country as user_country,
          u.created_at as user_created_at,
          reviewer.name as reviewer_name,
          reviewer.email as reviewer_email
        FROM kyc_requests kr
        JOIN users u ON kr.user_id = u.id
        LEFT JOIN users reviewer ON kr.reviewed_by = reviewer.id
        WHERE kr.id = ${requestId}
      `;

      if (results.length === 0) return null;

      const result = results[0];
      return {
        id: result.id,
        userId: result.user_id,
        status: result.status,
        documents: result.documents,
        selfiePath: result.selfie_path,
        fullName: result.full_name,
        dateOfBirth: result.date_of_birth,
        countryOfResidence: result.country_of_residence,
        residentialAddress: result.residential_address,
        documentTypes: result.document_types,
        submissionIp: result.submission_ip,
        deviceFingerprint: result.device_fingerprint,
        reviewedBy: result.reviewed_by,
        reviewedAt: result.reviewed_at,
        rejectionReason: result.rejection_reason,
        adminNotes: result.admin_notes,
        riskScore: result.risk_score,
        complianceFlags: result.compliance_flags,
        submittedAt: result.submitted_at,
        updatedAt: result.updated_at,
        user: {
          id: result.user_id,
          name: result.user_name,
          email: result.user_email,
          country: result.user_country
        },
        reviewer: result.reviewer_name ? {
          id: result.reviewed_by,
          name: result.reviewer_name,
          email: result.reviewer_email
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching KYC request:', error);
      return null;
    }
  }

  // Admin: Review and approve/reject KYC request
  static async reviewKycRequest(requestId: string, reviewData: KycReviewData): Promise<{ success: boolean; message: string }> {
    try {
      // Get the current request
      const currentRequest = await this.getKycRequestById(requestId);
      if (!currentRequest) {
        return {
          success: false,
          message: 'KYC request not found'
        };
      }

      if (currentRequest.status === 'APPROVED' || currentRequest.status === 'REJECTED') {
        return {
          success: false,
          message: 'KYC request has already been reviewed'
        };
      }

      // Update KYC request
      await prisma.$queryRaw`
        UPDATE kyc_requests SET
          status = ${reviewData.status},
          reviewed_by = ${reviewData.adminId},
          reviewed_at = NOW(),
          rejection_reason = ${reviewData.rejectionReason || null},
          admin_notes = ${reviewData.adminNotes || null},
          risk_score = ${reviewData.riskScore || 0},
          compliance_flags = ${JSON.stringify(reviewData.complianceFlags || {})},
          updated_at = NOW()
        WHERE id = ${requestId}
      `;

      // Update user KYC status
      const userKycStatus = reviewData.status === 'APPROVED' ? 'APPROVED' : 
                           reviewData.status === 'REJECTED' ? 'REJECTED' : 'IN_REVIEW';

      await prisma.user.update({
        where: { id: currentRequest.userId },
        data: { 
          kycStatus: userKycStatus as any,
          identityVerified: reviewData.status === 'APPROVED',
          updatedAt: new Date()
        }
      });

      // Log admin action
      await prisma.adminLog.create({
        data: {
          adminId: reviewData.adminId,
          action: `KYC_${reviewData.status}`,
          targetUserId: currentRequest.userId,
          description: `KYC request ${reviewData.status.toLowerCase()}: ${reviewData.adminNotes || 'No additional notes'}`
        }
      });

      // Log security event
      await prisma.securityEvent.create({
        data: {
          userId: currentRequest.userId,
          eventType: reviewData.status === 'APPROVED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
          description: `KYC verification ${reviewData.status.toLowerCase()} by admin`,
          riskLevel: reviewData.status === 'REJECTED' ? 'MEDIUM' : 'LOW',
          metadata: {
            requestId,
            adminId: reviewData.adminId,
            rejectionReason: reviewData.rejectionReason,
            riskScore: reviewData.riskScore
          }
        }
      });

      // If rejected, optionally clean up documents (GDPR compliance)
      if (reviewData.status === 'REJECTED' && process.env.AUTO_DELETE_REJECTED_DOCS === 'true') {
        // Delete documents after 30 days (implement as background job)
        // For now, just log the requirement
        console.log(`Schedule document deletion for rejected KYC request: ${requestId}`);
      }

      return {
        success: true,
        message: `KYC request ${reviewData.status.toLowerCase()} successfully`
      };

    } catch (error) {
      console.error('KYC review error:', error);
      return {
        success: false,
        message: 'Failed to review KYC request'
      };
    }
  }

  // GDPR: Delete user's KYC data
  static async deleteUserKycData(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get all KYC requests for the user
      const requests = await prisma.$queryRaw<{ id: string; documents: string[]; selfie_path: string }[]>`
        SELECT id, documents, selfie_path 
        FROM kyc_requests 
        WHERE user_id = ${userId}
      `;

      // Securely delete all associated files
      for (const request of requests) {
        // Delete document files
        if (request.documents) {
          for (const docPath of request.documents) {
            secureDeleteFile(docPath);
          }
        }

        // Delete selfie file
        if (request.selfie_path) {
          secureDeleteFile(request.selfie_path);
        }
      }

      // Delete database records
      await prisma.$queryRaw`
        DELETE FROM kyc_requests WHERE user_id = ${userId}
      `;

      // Reset user KYC status
      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'PENDING',
          identityVerified: false,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        message: 'KYC data deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting KYC data:', error);
      return {
        success: false,
        message: 'Failed to delete KYC data'
      };
    }
  }

  // Get KYC statistics for admin dashboard
  static async getKycStatistics() {
    try {
      const stats = await prisma.$queryRaw<{
        total_requests: string;
        pending_requests: string;
        approved_requests: string;
        rejected_requests: string;
        avg_processing_time_hours: string;
      }[]>`
        SELECT 
          COUNT(*)::text as total_requests,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::text as pending_requests,
          COUNT(CASE WHEN status = 'APPROVED' THEN 1 END)::text as approved_requests,
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END)::text as rejected_requests,
          COALESCE(
            AVG(
              CASE WHEN reviewed_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (reviewed_at - submitted_at))/3600 
              END
            )::text, 
            '0'
          ) as avg_processing_time_hours
        FROM kyc_requests
        WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
      `;

      return {
        totalRequests: parseInt(stats[0]?.total_requests || '0'),
        pendingRequests: parseInt(stats[0]?.pending_requests || '0'),
        approvedRequests: parseInt(stats[0]?.approved_requests || '0'),
        rejectedRequests: parseInt(stats[0]?.rejected_requests || '0'),
        avgProcessingTimeHours: parseFloat(stats[0]?.avg_processing_time_hours || '0')
      };

    } catch (error) {
      console.error('Error fetching KYC statistics:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        avgProcessingTimeHours: 0
      };
    }
  }
}

export default KycService;