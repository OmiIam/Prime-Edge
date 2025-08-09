import { Request, Response } from 'express';
import { transferService, CreateTransferRequest } from '../services/transferService';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse 
} from '../utils/responseHelpers';

// Extend Express Request to include user information
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export class TransferController {
  /**
   * POST /api/user/transfer
   * Creates a pending external transfer
   */
  async createTransfer(req: AuthenticatedRequest, res: Response) {
    try {
      const { amount, currency, recipient, metadata } = req.body;

      // Validate request body structure
      if (!amount || !recipient) {
        return res.status(400).json(
          createErrorResponse('Amount and recipient information are required')
        );
      }

      if (!recipient.name || !recipient.accountNumber || !recipient.bankCode) {
        return res.status(400).json(
          createErrorResponse('Recipient name, account number, and bank code are required')
        );
      }

      const createRequest: CreateTransferRequest = {
        amount: parseFloat(amount),
        currency,
        recipient: {
          name: String(recipient.name).trim(),
          accountNumber: String(recipient.accountNumber).trim(),
          bankCode: String(recipient.bankCode).trim(),
        },
        metadata,
      };

      const transaction = await transferService.createPendingTransfer(
        req.user.id, 
        createRequest
      );

      res.status(201).json(
        createSuccessResponse(
          { transaction },
          'External transfer submitted for approval. You will be notified once processed.'
        )
      );
    } catch (error) {
      console.error('Create transfer error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create transfer';
      
      res.status(400).json(
        createErrorResponse(message)
      );
    }
  }

  /**
   * GET /api/user/transfer-updates
   * Returns latest external transfers for the authenticated user (polling fallback)
   */
  async getTransferUpdates(req: AuthenticatedRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const since = req.query.since ? new Date(req.query.since as string) : undefined;

      if (since && isNaN(since.getTime())) {
        return res.status(400).json(
          createErrorResponse('Invalid date format for since parameter')
        );
      }

      const result = await transferService.getTransferUpdates(req.user.id, {
        limit,
        since,
      });

      res.json(
        createSuccessResponse(
          result,
          `Found ${result.updates.length} transfer updates`
        )
      );
    } catch (error) {
      console.error('Get transfer updates error:', error);
      
      // Always return success with empty updates to prevent frontend errors
      res.json(
        createSuccessResponse(
          { updates: [], count: 0, timestamp: new Date().toISOString() },
          'No transfer updates available'
        )
      );
    }
  }
}

export class AdminTransferController {
  /**
   * GET /api/admin/pending-transfers
   * Lists all pending external transfers for admin review
   */
  async getPendingTransfers(req: AuthenticatedRequest, res: Response) {
    try {
      // Check admin role
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json(
          createErrorResponse('Admin access required')
        );
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await transferService.getPendingTransfers({ page, limit });

      res.json(
        createPaginatedResponse(
          result.transfers,
          result.pagination.page,
          result.pagination.limit,
          result.pagination.total,
          `Found ${result.transfers.length} pending transfers`
        )
      );
    } catch (error) {
      console.error('Get pending transfers error:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch pending transfers';
      
      res.status(500).json(
        createErrorResponse(message)
      );
    }
  }

  /**
   * POST /api/admin/transfer/:id/approve
   * Approves a pending transfer
   */
  async approveTransfer(req: AuthenticatedRequest, res: Response) {
    try {
      // Check admin role
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json(
          createErrorResponse('Admin access required')
        );
      }

      const transferId = req.params.id;
      const { reference } = req.body;

      if (!transferId) {
        return res.status(400).json(
          createErrorResponse('Transfer ID is required')
        );
      }

      const transaction = await transferService.approveTransfer(
        transferId,
        req.user.id,
        reference
      );

      res.json(
        createSuccessResponse(
          { transaction },
          `Transfer ${transaction.status === 'COMPLETED' ? 'approved and completed' : 'approved for processing'}`
        )
      );
    } catch (error) {
      console.error('Approve transfer error:', error);
      const message = error instanceof Error ? error.message : 'Failed to approve transfer';
      
      res.status(400).json(
        createErrorResponse(message)
      );
    }
  }

  /**
   * POST /api/admin/transfer/:id/reject
   * Rejects a pending transfer
   */
  async rejectTransfer(req: AuthenticatedRequest, res: Response) {
    try {
      // Check admin role
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json(
          createErrorResponse('Admin access required')
        );
      }

      const transferId = req.params.id;
      const { reason } = req.body;

      if (!transferId) {
        return res.status(400).json(
          createErrorResponse('Transfer ID is required')
        );
      }

      if (!reason) {
        return res.status(400).json(
          createErrorResponse('Rejection reason is required')
        );
      }

      const transaction = await transferService.rejectTransfer(
        transferId,
        req.user.id,
        reason
      );

      res.json(
        createSuccessResponse(
          { transaction },
          'Transfer rejected successfully'
        )
      );
    } catch (error) {
      console.error('Reject transfer error:', error);
      const message = error instanceof Error ? error.message : 'Failed to reject transfer';
      
      res.status(400).json(
        createErrorResponse(message)
      );
    }
  }

  /**
   * GET /api/admin/transfer-stats
   * Gets transfer statistics for admin dashboard
   */
  async getTransferStats(req: AuthenticatedRequest, res: Response) {
    try {
      // Check admin role
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json(
          createErrorResponse('Admin access required')
        );
      }

      const stats = await transferService.getTransferStats();

      res.json(
        createSuccessResponse(
          stats,
          'Transfer statistics retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Get transfer stats error:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch transfer statistics';
      
      res.status(500).json(
        createErrorResponse(message)
      );
    }
  }
}

// Create controller instances
export const transferController = new TransferController();
export const adminTransferController = new AdminTransferController();