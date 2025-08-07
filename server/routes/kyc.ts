import express from 'express';
import { requireAuth } from '../middleware/auth';
import { kycUpload, validateUploadedFiles } from '../middleware/uploadMiddleware';
import { 
  kycSubmissionRateLimit, 
  validateKycSubmission, 
  handleValidationErrors,
  sanitizeKycData,
  detectSuspiciousActivity,
  validateGeolocation
} from '../middleware/validation';
import KycController from '../controllers/kycController';

const router = express.Router();

// Apply authentication to all KYC routes
router.use(requireAuth);

/**
 * @route   POST /api/kyc/submit
 * @desc    Submit KYC verification documents and information
 * @access  Private (authenticated users only)
 * @body    {
 *   fullName: string,
 *   dateOfBirth: string (YYYY-MM-DD),
 *   countryOfResidence: string (ISO 2-letter code),
 *   residentialAddress: string,
 *   documentTypes: string[] (JSON array of document types),
 *   deviceFingerprint?: string
 * }
 * @files   {
 *   documents: File[] (1-3 identity documents),
 *   selfie: File (1 selfie/face capture)
 * }
 */
router.post('/submit',
  kycSubmissionRateLimit,
  kycUpload,
  validateUploadedFiles,
  validateKycSubmission,
  handleValidationErrors,
  sanitizeKycData,
  detectSuspiciousActivity,
  validateGeolocation,
  KycController.submitKyc
);

/**
 * @route   POST /api/kyc/resubmit
 * @desc    Resubmit KYC after rejection
 * @access  Private (authenticated users only)
 */
router.post('/resubmit',
  kycSubmissionRateLimit,
  kycUpload,
  validateUploadedFiles,
  validateKycSubmission,
  handleValidationErrors,
  sanitizeKycData,
  detectSuspiciousActivity,
  validateGeolocation,
  KycController.resubmitKyc
);

/**
 * @route   GET /api/kyc/status
 * @desc    Get current KYC status and submission details
 * @access  Private (authenticated users only)
 */
router.get('/status', KycController.getKycStatus);

/**
 * @route   GET /api/kyc/document/:filename
 * @desc    Download user's own KYC document (GDPR compliance)
 * @access  Private (authenticated users only)
 * @param   filename - Name of the document file
 */
router.get('/document/:filename', KycController.downloadKycDocument);

/**
 * @route   DELETE /api/kyc/data
 * @desc    Delete user's KYC data (GDPR right to be forgotten)
 * @access  Private (authenticated users only)
 * @note    Cannot delete approved KYC data without admin approval
 */
router.delete('/data', KycController.deleteKycData);

// Error handling middleware for KYC routes
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('KYC Route Error:', error);

  // Handle Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum 5MB per file.'
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files. Maximum 4 files allowed (3 documents + 1 selfie).'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Only "documents" and "selfie" fields are allowed.'
    });
  }

  // Handle general file upload errors
  if (error.message && error.message.includes('Invalid file')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Handle validation errors
  if (error.message && error.message.includes('validation')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred during KYC processing'
  });
});

export default router;