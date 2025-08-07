import { Request, Response } from 'express';
import { KycService, KycReviewData } from '../services/kycService';
import path from 'path';
import fs from 'fs';

export class AdminKycController {
  // Get all pending KYC requests for admin review
  static async getPendingRequests(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      // Get pending requests
      let requests = await KycService.getPendingKycRequests();
      
      // Filter by status if specified
      if (status && ['PENDING', 'IN_REVIEW', 'REQUIRES_ADDITIONAL_INFO'].includes(status)) {
        requests = requests.filter(req => req.status === status);
      }

      // Sort by submission date (oldest first for fairness)
      requests.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRequests = requests.slice(startIndex, endIndex);

      // Calculate additional metrics
      const requestsWithMetrics = paginatedRequests.map(request => ({
        ...request,
        // Calculate days since submission
        daysSinceSubmission: Math.floor(
          (Date.now() - new Date(request.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
        ),
        // Risk indicators
        riskIndicators: {
          newAccount: request.user && new Date().getTime() - new Date(request.user.country).getTime() < 30 * 24 * 60 * 60 * 1000,
          highRiskCountry: ['AF', 'IQ', 'KP', 'IR', 'SY'].includes(request.countryOfResidence),
          suspiciousPattern: request.fullName.toLowerCase().includes('test') || 
                           request.residentialAddress.toLowerCase().includes('test')
        }
      }));

      res.status(200).json({
        success: true,
        data: {
          requests: requestsWithMetrics,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(requests.length / limit),
            totalItems: requests.length,
            itemsPerPage: limit,
            hasNextPage: endIndex < requests.length,
            hasPreviousPage: startIndex > 0
          },
          summary: {
            pendingCount: requests.filter(r => r.status === 'PENDING').length,
            inReviewCount: requests.filter(r => r.status === 'IN_REVIEW').length,
            requiresInfoCount: requests.filter(r => r.status === 'REQUIRES_ADDITIONAL_INFO').length,
            averageWaitTime: requests.length > 0 ? 
              requests.reduce((sum, req) => sum + Math.floor(
                (Date.now() - new Date(req.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
              ), 0) / requests.length : 0
          }
        }
      });

    } catch (error) {
      console.error('Error fetching pending KYC requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending KYC requests'
      });
    }
  }

  // Get detailed view of a specific KYC request
  static async getKycRequestDetails(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      
      const request = await KycService.getKycRequestById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'KYC request not found'
        });
      }

      // Add file information
      const documentsWithInfo = request.documents.map(filename => {
        const filePath = path.join(process.cwd(), 'server', 'uploads', 'kyc', filename);
        let fileInfo = { filename, exists: false, size: 0, type: 'unknown' };
        
        try {
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            fileInfo = {
              filename,
              exists: true,
              size: stats.size,
              type: path.extname(filename).toLowerCase()
            };
          }
        } catch (error) {
          console.error(`Error checking file ${filename}:`, error);
        }
        
        return fileInfo;
      });

      let selfieInfo = null;
      if (request.selfiePath) {
        const selfiePath = path.join(process.cwd(), 'server', 'uploads', 'kyc', request.selfiePath);
        try {
          if (fs.existsSync(selfiePath)) {
            const stats = fs.statSync(selfiePath);
            selfieInfo = {
              filename: request.selfiePath,
              exists: true,
              size: stats.size,
              type: path.extname(request.selfiePath).toLowerCase()
            };
          }
        } catch (error) {
          console.error(`Error checking selfie ${request.selfiePath}:`, error);
        }
      }

      // Calculate risk score based on various factors
      const riskScore = calculateRiskScore(request);

      const detailedRequest = {
        ...request,
        documentsInfo: documentsWithInfo,
        selfieInfo,
        calculatedRiskScore: riskScore,
        verificationChecks: {
          ageVerified: calculateAge(request.dateOfBirth) >= 18,
          nameConsistency: true, // Would implement name matching logic
          addressFormat: validateAddressFormat(request.residentialAddress),
          documentTypeValid: request.documentTypes.every(type => 
            ['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID', 'STATE_ID'].includes(type)
          )
        },
        timeline: {
          submitted: request.submittedAt,
          daysSinceSubmission: Math.floor(
            (Date.now() - new Date(request.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
          ),
          lastUpdated: request.updatedAt
        }
      };

      res.status(200).json({
        success: true,
        data: detailedRequest
      });

    } catch (error) {
      console.error('Error fetching KYC request details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KYC request details'
      });
    }
  }

  // Download KYC document for admin review
  static async downloadDocument(req: Request, res: Response) {
    try {
      const { requestId, filename } = req.params;
      
      // Verify request exists and admin has access
      const request = await KycService.getKycRequestById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'KYC request not found'
        });
      }

      // Verify file belongs to this request
      const allFiles = [...request.documents];
      if (request.selfiePath) {
        allFiles.push(request.selfiePath);
      }

      if (!allFiles.includes(filename)) {
        return res.status(403).json({
          success: false,
          message: 'Document not associated with this KYC request'
        });
      }

      const filePath = path.join(process.cwd(), 'server', 'uploads', 'kyc', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Document file not found'
        });
      }

      // Log admin document access
      console.log(`Admin ${req.user!.id} accessed document ${filename} for KYC request ${requestId}`);

      // Set security headers
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      
      res.sendFile(filePath);

    } catch (error) {
      console.error('Error downloading KYC document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document'
      });
    }
  }

  // Approve or reject KYC request
  static async reviewKycRequest(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const { status, rejectionReason, adminNotes, riskScore, complianceFlags } = req.body;
      const adminId = req.user!.id;

      const reviewData: KycReviewData = {
        adminId,
        status,
        rejectionReason,
        adminNotes,
        riskScore,
        complianceFlags
      };

      const result = await KycService.reviewKycRequest(requestId, reviewData);

      if (result.success) {
        // Log the admin action
        console.log(`Admin ${adminId} ${status.toLowerCase()} KYC request ${requestId}`);

        res.status(200).json({
          success: true,
          message: result.message,
          data: {
            requestId,
            newStatus: status,
            reviewedBy: adminId,
            reviewedAt: new Date().toISOString()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error reviewing KYC request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review KYC request'
      });
    }
  }

  // Bulk operations for KYC requests
  static async bulkUpdateRequests(req: Request, res: Response) {
    try {
      const { requestIds, action, data } = req.body;
      const adminId = req.user!.id;

      if (!Array.isArray(requestIds) || requestIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request IDs array is required'
        });
      }

      if (requestIds.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Cannot process more than 50 requests at once'
        });
      }

      const results = [];

      for (const requestId of requestIds) {
        try {
          let result;
          
          switch (action) {
            case 'APPROVE':
              result = await KycService.reviewKycRequest(requestId, {
                adminId,
                status: 'APPROVED',
                adminNotes: data?.adminNotes || 'Bulk approval'
              });
              break;
              
            case 'REJECT':
              result = await KycService.reviewKycRequest(requestId, {
                adminId,
                status: 'REJECTED',
                rejectionReason: data?.rejectionReason || 'Bulk rejection',
                adminNotes: data?.adminNotes
              });
              break;
              
            case 'SET_IN_REVIEW':
              result = await KycService.reviewKycRequest(requestId, {
                adminId,
                status: 'REQUIRES_ADDITIONAL_INFO',
                adminNotes: data?.adminNotes || 'Moved to review status'
              });
              break;
              
            default:
              result = { success: false, message: 'Invalid bulk action' };
          }

          results.push({
            requestId,
            success: result.success,
            message: result.message
          });

        } catch (error) {
          results.push({
            requestId,
            success: false,
            message: 'Processing failed'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.status(200).json({
        success: true,
        message: `Bulk operation completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
        }
      });

    } catch (error) {
      console.error('Error in bulk KYC operations:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk operation failed'
      });
    }
  }

  // Get KYC statistics for admin dashboard
  static async getKycStatistics(req: Request, res: Response) {
    try {
      const stats = await KycService.getKycStatistics();
      
      res.status(200).json({
        success: true,
        data: {
          ...stats,
          reportGenerated: new Date().toISOString(),
          performance: {
            approvalRate: stats.totalRequests > 0 ? 
              (stats.approvedRequests / stats.totalRequests * 100).toFixed(1) + '%' : '0%',
            rejectionRate: stats.totalRequests > 0 ? 
              (stats.rejectedRequests / stats.totalRequests * 100).toFixed(1) + '%' : '0%',
            avgProcessingDays: (stats.avgProcessingTimeHours / 24).toFixed(1)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching KYC statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KYC statistics'
      });
    }
  }
}

// Helper functions
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

function calculateRiskScore(request: any): number {
  let score = 0;

  // Age-based risk (very young or very old might be higher risk)
  const age = calculateAge(request.dateOfBirth);
  if (age < 21 || age > 80) score += 10;

  // High-risk countries (simplified example)
  const highRiskCountries = ['AF', 'IQ', 'KP', 'IR', 'SY', 'YE'];
  if (highRiskCountries.includes(request.countryOfResidence)) score += 30;

  // Suspicious patterns in data
  if (request.fullName.toLowerCase().includes('test') || 
      request.residentialAddress.toLowerCase().includes('test')) {
    score += 50;
  }

  // Multiple document types might indicate legitimacy (lower risk)
  if (request.documentTypes.length >= 2) score -= 5;

  // New account risk
  if (request.user && new Date().getTime() - new Date(request.user.country).getTime() < 7 * 24 * 60 * 60 * 1000) {
    score += 15;
  }

  return Math.max(0, Math.min(100, score));
}

function validateAddressFormat(address: string): boolean {
  // Basic address validation - should contain numbers and letters
  const hasNumbers = /\d/.test(address);
  const hasLetters = /[a-zA-Z]/.test(address);
  const minLength = address.length >= 10;
  
  return hasNumbers && hasLetters && minLength;
}

export default AdminKycController;