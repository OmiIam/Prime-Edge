import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { transferService } from '../services/transferService';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse 
} from '../utils/responseHelpers';

/**
 * User Transfer Controllers
 * Handle HTTP requests for user transfer operations
 */
export class UserTransferController {
  /**
   * POST /api/user/transfer
   * Create a new external bank transfer
   */
  async createTransfer(req: AuthenticatedRequest, res: Response) {
    try {
      console.log(`[Controller] Create transfer request from user ${req.user.id}`);

      const { amount, currency, recipientInfo, description } = req.body;

      // Validate required fields
      if (!amount) {
        return res.status(400).json(
          createErrorResponse('Amount is required')
        );
      }

      if (!recipientInfo) {
        return res.status(400).json(
          createErrorResponse('Recipient information is required')
        );
      }

      // Create transfer via service
      const transaction = await transferService.createTransfer(req.user.id, {
        amount,
        currency,
        recipientInfo,
        description
      });

      console.log(`[Controller] Transfer created successfully: ${transaction?.id}`);

      return res.status(201).json(
        createSuccessResponse(
          'Transfer submitted successfully and is awaiting approval',
          { transaction }
        )
      );

    } catch (error) {
      console.error('[Controller] Create transfer error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create transfer';
      
      return res.status(400).json(
        createErrorResponse(message)
      );
    }
  }

  /**
   * GET /api/user/transfer-updates
   * Get latest transfer updates for the authenticated user
   */
  async getTransferUpdates(req: AuthenticatedRequest, res: Response) {
    try {
      console.log(`[Controller] Getting transfer updates for user ${req.user.id}`);

      const { limit, since } = req.query;

      const result = await transferService.getUserTransferUpdates(req.user.id, {
        limit: limit as string,
        since: since as string
      });

      console.log(`[Controller] Retrieved ${result.transfers.length} transfer updates`);

      return res.json(
        createSuccessResponse(
          `Retrieved ${result.transfers.length} transfer updates`,
          result
        )
      );

    } catch (error) {
      console.error('[Controller] Get transfer updates error:', error);
      
      // Always return success with empty data to prevent frontend errors
      return res.json(
        createSuccessResponse(
          'No transfer updates available',
          { transfers: [], count: 0 }
        )
      );
    }
  }
}

/**
 * Admin Transfer Controllers
 * Handle HTTP requests for admin transfer operations
 */
export class AdminTransferController {
  /**
   * GET /api/admin/pending-transfers
   * Get all pending transfers for admin review
   */
  async getPendingTransfers(req: AuthenticatedRequest, res: Response) {
    try {
      console.log(`[Controller] Admin ${req.user.id} requesting pending transfers`);

      const { page, limit } = req.query;

      const result = await transferService.getPendingTransfers({
        page: page as string,
        limit: limit as string
      });

      console.log(`[Controller] Retrieved ${result.transfers.length} pending transfers`);

      return res.json(
        createPaginatedResponse(
          `Retrieved ${result.transfers.length} pending transfers`,
          result.transfers,
          result.pagination.page,
          result.pagination.limit,
          result.pagination.total
        )
      );

    } catch (error) {
      console.error('[Controller] Get pending transfers error:', error);
      const message = error instanceof Error ? error.message : 'Failed to retrieve pending transfers';
      
      return res.status(500).json(
        createErrorResponse(message)
      );
    }
  }

  /**
   * POST /api/admin/transfer/:id/approve
   * Approve a pending transfer
   */
  async approveTransfer(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: transferId } = req.params;
      const { adminNotes } = req.body;

      console.log(`[Controller] Admin ${req.user.id} approving transfer ${transferId}`);

      if (!transferId) {
        return res.status(400).json(
          createErrorResponse('Transfer ID is required')
        );
      }

      const transaction = await transferService.approveTransfer(
        transferId,
        req.user.id,
        adminNotes
      );

      console.log(`[Controller] Transfer ${transferId} approved successfully`);

      return res.json(
        createSuccessResponse(
          'Transfer approved and will be processed shortly',
          { transaction }
        )
      );

    } catch (error) {
      console.error('[Controller] Approve transfer error:', error);
      const message = error instanceof Error ? error.message : 'Failed to approve transfer';
      
      return res.status(400).json(
        createErrorResponse(message)
      );
    }
  }

  /**
   * POST /api/admin/transfer/:id/reject
   * Reject a pending transfer
   */
  async rejectTransfer(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: transferId } = req.params;
      const { rejectionReason } = req.body;

      console.log(`[Controller] Admin ${req.user.id} rejecting transfer ${transferId}`);

      if (!transferId) {
        return res.status(400).json(
          createErrorResponse('Transfer ID is required')
        );
      }

      if (!rejectionReason) {
        return res.status(400).json(
          createErrorResponse('Rejection reason is required')
        );
      }

      const transaction = await transferService.rejectTransfer(
        transferId,
        req.user.id,
        rejectionReason
      );

      console.log(`[Controller] Transfer ${transferId} rejected successfully`);

      return res.json(
        createSuccessResponse(
          'Transfer rejected successfully',
          { transaction }
        )
      );

    } catch (error) {
      console.error('[Controller] Reject transfer error:', error);
      const message = error instanceof Error ? error.message : 'Failed to reject transfer';
      
      return res.status(400).json(
        createErrorResponse(message)
      );
    }
  }

  /**
   * GET /api/admin/transfer-stats
   * Get transfer statistics for admin dashboard
   */
  async getTransferStats(req: AuthenticatedRequest, res: Response) {
    try {
      console.log(`[Controller] Admin ${req.user.id} requesting transfer stats`);

      const stats = await transferService.getTransferStats();

      console.log('[Controller] Transfer stats retrieved successfully');

      return res.json(
        createSuccessResponse(
          'Transfer statistics retrieved successfully',
          stats
        )
      );

    } catch (error) {
      console.error('[Controller] Get transfer stats error:', error);
      const message = error instanceof Error ? error.message : 'Failed to retrieve transfer statistics';
      
      return res.status(500).json(
        createErrorResponse(message)
      );
    }
  }
}

// Export controller instances
export const userTransferController = new UserTransferController();
export const adminTransferController = new AdminTransferController();