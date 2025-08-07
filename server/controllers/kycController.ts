import { Request, Response } from 'express';
import { KycService, KycSubmissionData } from '../services/kycService';
import { moveFilesToKycDirectory, cleanupUploadedFiles } from '../middleware/uploadMiddleware';
import path from 'path';
import fs from 'fs';

export class KycController {
  // Submit KYC verification documents and information
  static async submitKyc(req: Request, res: Response) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const { fullName, dateOfBirth, countryOfResidence, residentialAddress, documentTypes } = req.body;
      const userId = req.user!.id;

      // Validate uploaded files structure
      if (!files || !files.documents || !files.selfie) {
        if (files) {
          // Clean up any uploaded files
          const allFiles = [...(files.documents || []), ...(files.selfie || [])];
          cleanupUploadedFiles(allFiles);
        }
        
        return res.status(400).json({
          success: false,
          message: 'Both identity documents and selfie are required'
        });
      }

      const documentFiles = files.documents;
      const selfieFiles = files.selfie;

      // Validate file counts
      if (documentFiles.length < 1 || documentFiles.length > 3) {
        const allFiles = [...documentFiles, ...selfieFiles];
        cleanupUploadedFiles(allFiles);
        
        return res.status(400).json({
          success: false,
          message: 'Please upload 1-3 identity documents'
        });
      }

      if (selfieFiles.length !== 1) {
        const allFiles = [...documentFiles, ...selfieFiles];
        cleanupUploadedFiles(allFiles);
        
        return res.status(400).json({
          success: false,
          message: 'Please upload exactly one selfie'
        });
      }

      // Move files from temp to secure KYC directory
      const documentPaths = moveFilesToKycDirectory(documentFiles);
      const selfiePaths = moveFilesToKycDirectory(selfieFiles);
      const selfiePath = selfiePaths[0];

      // Parse document types
      let parsedDocumentTypes: string[];
      try {
        parsedDocumentTypes = typeof documentTypes === 'string' 
          ? JSON.parse(documentTypes) 
          : documentTypes;
      } catch {
        parsedDocumentTypes = Array.isArray(documentTypes) ? documentTypes : [documentTypes];
      }

      // Validate document types count matches uploaded documents
      if (parsedDocumentTypes.length !== documentFiles.length) {
        return res.status(400).json({
          success: false,
          message: 'Number of document types must match number of uploaded documents'
        });
      }

      // Prepare submission data
      const submissionData: KycSubmissionData = {
        userId,
        fullName,
        dateOfBirth,
        countryOfResidence,
        residentialAddress,
        documentPaths,
        selfiePath,
        documentTypes: parsedDocumentTypes,
        submissionIp: req.ip || req.socket.remoteAddress,
        deviceFingerprint: req.body.deviceFingerprint
      };

      // Submit KYC request
      const result = await KycService.submitKycRequest(submissionData);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            requestId: result.requestId,
            status: 'PENDING',
            submittedAt: new Date().toISOString(),
            documentsUploaded: documentFiles.length,
            estimatedReviewTime: '1-3 business days'
          }
        });
      } else {
        // Clean up files if submission failed
        const allPaths = [...documentPaths, selfiePath];
        allPaths.forEach(filePath => {
          try {
            const fullPath = path.join(process.cwd(), 'server', 'uploads', 'kyc', filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          } catch (error) {
            console.error(`Failed to cleanup file ${filePath}:`, error);
          }
        });

        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('KYC submission error:', error);
      
      // Clean up uploaded files on error
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      if (files) {
        const allFiles = [...(files.documents || []), ...(files.selfie || [])];
        cleanupUploadedFiles(allFiles);
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during KYC submission'
      });
    }
  }

  // Get user's current KYC status and details
  static async getKycStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const kycRequest = await KycService.getUserKycStatus(userId);

      if (!kycRequest) {
        return res.status(200).json({
          success: true,
          data: {
            status: 'NOT_SUBMITTED',
            message: 'No KYC verification request found',
            canSubmit: true
          }
        });
      }

      // Return sanitized data (exclude sensitive admin information)
      res.status(200).json({
        success: true,
        data: {
          requestId: kycRequest.id,
          status: kycRequest.status,
          submittedAt: kycRequest.submittedAt,
          reviewedAt: kycRequest.reviewedAt,
          rejectionReason: kycRequest.status === 'REJECTED' ? kycRequest.rejectionReason : null,
          canResubmit: kycRequest.status === 'REJECTED',
          canSubmit: false,
          documentsSubmitted: kycRequest.documents.length,
          lastUpdated: kycRequest.updatedAt,
          // Include basic info for user verification
          submittedInfo: {
            fullName: kycRequest.fullName,
            dateOfBirth: kycRequest.dateOfBirth,
            countryOfResidence: kycRequest.countryOfResidence
          }
        }
      });

    } catch (error) {
      console.error('Error fetching KYC status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KYC status'
      });
    }
  }

  // Download user's own KYC documents (GDPR compliance)
  static async downloadKycDocument(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const userId = req.user!.id;

      // Verify the file belongs to the user
      const kycRequest = await KycService.getUserKycStatus(userId);
      if (!kycRequest) {
        return res.status(404).json({
          success: false,
          message: 'No KYC request found'
        });
      }

      const allFiles = [...kycRequest.documents];
      if (kycRequest.selfiePath) {
        allFiles.push(kycRequest.selfiePath);
      }

      if (!allFiles.includes(filename)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this document'
        });
      }

      // Serve the file
      const filePath = path.join(process.cwd(), 'server', 'uploads', 'kyc', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Set security headers
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      res.sendFile(filePath);

    } catch (error) {
      console.error('Error downloading KYC document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document'
      });
    }
  }

  // Delete user's KYC data (GDPR right to be forgotten)
  static async deleteKycData(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Check if KYC is approved (might need admin approval to delete)
      const kycRequest = await KycService.getUserKycStatus(userId);
      if (kycRequest && kycRequest.status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete approved KYC data. Please contact support for assistance.'
        });
      }

      const result = await KycService.deleteUserKycData(userId);
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'KYC data deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error deleting KYC data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete KYC data'
      });
    }
  }

  // Resubmit KYC after rejection
  static async resubmitKyc(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Check current KYC status
      const currentRequest = await KycService.getUserKycStatus(userId);
      if (!currentRequest) {
        return res.status(400).json({
          success: false,
          message: 'No previous KYC request found'
        });
      }

      if (currentRequest.status !== 'REJECTED') {
        return res.status(400).json({
          success: false,
          message: 'Can only resubmit after rejection'
        });
      }

      // Delete old KYC data first
      await KycService.deleteUserKycData(userId);

      // Proceed with new submission (same as submitKyc)
      await KycController.submitKyc(req, res);

    } catch (error) {
      console.error('Error resubmitting KYC:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resubmit KYC'
      });
    }
  }
}

export default KycController;