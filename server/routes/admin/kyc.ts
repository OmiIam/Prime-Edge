import express from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { 
  validateKycReview,
  handleValidationErrors,
  sanitizeKycData
} from '../../middleware/validation';
import AdminKycController from '../../controllers/adminKycController';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(requireAuth, requireAdmin);

/**
 * @route   GET /api/admin/kyc/pending
 * @desc    Get all pending KYC requests for admin review
 * @access  Admin only
 * @query   {
 *   page?: number (default: 1),
 *   limit?: number (default: 10, max: 50),
 *   status?: string (PENDING | IN_REVIEW | REQUIRES_ADDITIONAL_INFO)
 * }
 */
router.get('/pending', AdminKycController.getPendingRequests);

/**
 * @route   GET /api/admin/kyc/statistics
 * @desc    Get KYC statistics for admin dashboard
 * @access  Admin only
 */
router.get('/statistics', AdminKycController.getKycStatistics);

/**
 * @route   GET /api/admin/kyc/:requestId
 * @desc    Get detailed view of specific KYC request
 * @access  Admin only
 * @param   requestId - UUID of the KYC request
 */
router.get('/:requestId', AdminKycController.getKycRequestDetails);

/**
 * @route   GET /api/admin/kyc/:requestId/document/:filename
 * @desc    Download KYC document for admin review
 * @access  Admin only
 * @param   requestId - UUID of the KYC request
 * @param   filename - Name of the document file
 */
router.get('/:requestId/document/:filename', AdminKycController.downloadDocument);

/**
 * @route   PUT /api/admin/kyc/:requestId/review
 * @desc    Approve, reject, or request additional info for KYC
 * @access  Admin only
 * @param   requestId - UUID of the KYC request
 * @body    {
 *   status: 'APPROVED' | 'REJECTED' | 'REQUIRES_ADDITIONAL_INFO',
 *   rejectionReason?: string (required if REJECTED),
 *   adminNotes?: string,
 *   riskScore?: number (0-100),
 *   complianceFlags?: object
 * }
 */
router.put('/:requestId/review',
  validateKycReview,
  handleValidationErrors,
  sanitizeKycData,
  AdminKycController.reviewKycRequest
);

/**
 * @route   POST /api/admin/kyc/bulk-update
 * @desc    Bulk operations for KYC requests (approve/reject multiple)
 * @access  Admin only
 * @body    {
 *   requestIds: string[] (max 50),
 *   action: 'APPROVE' | 'REJECT' | 'SET_IN_REVIEW',
 *   data?: {
 *     rejectionReason?: string,
 *     adminNotes?: string
 *   }
 * }
 * @note    Use with caution - bulk operations should be carefully reviewed
 */
router.post('/bulk-update', AdminKycController.bulkUpdateRequests);

// Additional admin KYC management routes

/**
 * @route   GET /api/admin/kyc/export/csv
 * @desc    Export KYC data as CSV for reporting (GDPR compliant)
 * @access  Admin only
 * @query   {
 *   startDate?: string (YYYY-MM-DD),
 *   endDate?: string (YYYY-MM-DD),
 *   status?: string
 * }
 */
router.get('/export/csv', (req, res) => {
  // TODO: Implement CSV export functionality
  res.status(501).json({
    success: false,
    message: 'CSV export functionality not yet implemented'
  });
});

/**
 * @route   POST /api/admin/kyc/:requestId/flag
 * @desc    Flag KYC request for special attention or compliance review
 * @access  Admin only
 * @param   requestId - UUID of the KYC request
 * @body    {
 *   flagType: 'SUSPICIOUS' | 'COMPLIANCE_REVIEW' | 'MANUAL_VERIFICATION',
 *   reason: string,
 *   priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
 * }
 */
router.post('/:requestId/flag', (req, res) => {
  // TODO: Implement flagging functionality
  res.status(501).json({
    success: false,
    message: 'Flagging functionality not yet implemented'
  });
});

/**
 * @route   GET /api/admin/kyc/audit-trail/:requestId
 * @desc    Get complete audit trail for a KYC request
 * @access  Admin only
 * @param   requestId - UUID of the KYC request
 */
router.get('/audit-trail/:requestId', (req, res) => {
  // TODO: Implement audit trail functionality
  res.status(501).json({
    success: false,
    message: 'Audit trail functionality not yet implemented'
  });
});

// Error handling middleware specific to admin KYC routes
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Admin KYC Route Error:', error);

  // Log admin errors with more detail for security monitoring
  console.error('Admin KYC Error Details:', {
    adminId: req.user?.id,
    adminEmail: req.user?.email,
    route: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    error: error.message
  });

  // Handle specific admin operation errors
  if (error.message && error.message.includes('Insufficient permissions')) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient admin permissions for this operation'
    });
  }

  if (error.message && error.message.includes('Request not found')) {
    return res.status(404).json({
      success: false,
      message: 'KYC request not found or has been removed'
    });
  }

  // Generic admin error response
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred during admin KYC operation'
  });
});

export default router;