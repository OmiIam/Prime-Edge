/**
 * Admin Transfer Routes
 * Handles transfer approval/rejection with real-time WebSocket notifications
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { 
  sanitizeTransactionData, 
  createSuccessResponse, 
  createErrorResponse 
} from '../utils/sanitizer';
import { getSocketService } from '../services/socketService';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication and admin authorization to all routes
router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/pending-transfers
 * Returns all pending external bank transfers awaiting approval
 */
router.get('/pending-transfers', async (req: AuthenticatedRequest, res) => {
  try {
    console.log(`📋 Admin ${req.user?.id} requested pending transfers`);

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // Fetch pending external bank transfers with user info
    const [transfers, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          type: 'DEBIT',
          status: 'PENDING',
          metadata: {
            path: ['transferType'],
            equals: 'external_bank'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              balance: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          status: 'PENDING',
          metadata: {
            path: ['transferType'],
            equals: 'external_bank'
          }
        }
      })
    ]);

    console.log(`📊 Found ${transfers.length} pending transfers`);

    // Sanitize transfers and include user information
    const sanitizedTransfers = transfers.map(transfer => ({
      ...sanitizeTransactionData(transfer),
      user: {
        id: transfer.user.id,
        name: transfer.user.name,
        email: transfer.user.email,
        balance: transfer.user.balance
      }
    }));

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(
      createSuccessResponse(
        `Found ${total} pending transfers`,
        {
          transfers: sanitizedTransfers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      )
    );

  } catch (error) {
    console.error('❌ Admin pending transfers error:', error);
    res.status(500).json(
      createErrorResponse('Failed to fetch pending transfers')
    );
  }
});

/**
 * POST /api/admin/transfers/:id/review
 * Approves or rejects a pending transfer and emits real-time WebSocket notification
 */
router.post('/transfers/:id/review', async (req: AuthenticatedRequest, res) => {
  try {
    const transferId = req.params.id;
    const { action, reason } = req.body;

    console.log(`🔍 Admin ${req.user?.id} reviewing transfer ${transferId}: ${action}`);

    // Input validation
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json(
        createErrorResponse('Action must be either "approve" or "reject"')
      );
    }

    // Fetch the transaction with user information
    const transaction = await prisma.transaction.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: { id: true, name: true, email: true, balance: true }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json(
        createErrorResponse('Transfer not found')
      );
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json(
        createErrorResponse(`Transfer is already ${transaction.status.toLowerCase()}`)
      );
    }

    const currentTimestamp = new Date().toISOString();

    if (action === 'approve') {
      // Additional validation for approval
      if (transaction.user.balance < transaction.amount) {
        return res.status(400).json(
          createErrorResponse('User has insufficient balance for transfer')
        );
      }

      // Process approval in database transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update transaction status and metadata
        const updatedTransaction = await tx.transaction.update({
          where: { id: transferId },
          data: {
            status: 'COMPLETED',
            updatedAt: new Date(),
            metadata: {
              ...transaction.metadata,
              status: 'approved',
              approvedAt: currentTimestamp,
              approvedBy: req.user!.id,
              adminReason: reason || 'Transfer approved by admin',
              processedAt: currentTimestamp
            }
          }
        });

        // Deduct funds from user balance
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            balance: { decrement: transaction.amount }
          }
        });

        return updatedTransaction;
      });

      console.log(`✅ Transfer ${transferId} approved and processed`);

      // Emit real-time WebSocket event to user
      try {
        const socketService = getSocketService();
        socketService.emitTransferUpdate(
          transaction.userId,
          result,
          'approved',
          reason || 'Transfer approved and processed'
        );
        console.log(`📡 Approval notification sent via WebSocket`);
      } catch (socketError) {
        console.warn('⚠️ WebSocket notification failed:', socketError.message);
      }

      const sanitizedTransaction = sanitizeTransactionData(result);
      
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(
        createSuccessResponse(
          'Transfer approved and processed successfully',
          { transaction: sanitizedTransaction }
        )
      );

    } else if (action === 'reject') {
      // Process rejection
      const result = await prisma.transaction.update({
        where: { id: transferId },
        data: {
          status: 'REJECTED',
          updatedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            status: 'rejected',
            rejectedAt: currentTimestamp,
            rejectedBy: req.user!.id,
            adminReason: reason || 'Transfer rejected by admin review'
          }
        }
      });

      console.log(`❌ Transfer ${transferId} rejected`);

      // Emit real-time WebSocket event to user
      try {
        const socketService = getSocketService();
        socketService.emitTransferUpdate(
          transaction.userId,
          result,
          'rejected',
          reason || 'Transfer rejected after admin review'
        );
        console.log(`📡 Rejection notification sent via WebSocket`);
      } catch (socketError) {
        console.warn('⚠️ WebSocket notification failed:', socketError.message);
      }

      const sanitizedTransaction = sanitizeTransactionData(result);
      
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(
        createSuccessResponse(
          'Transfer rejected successfully',
          { transaction: sanitizedTransaction }
        )
      );
    }

  } catch (error) {
    console.error('❌ Admin transfer review error:', error);
    res.status(500).json(
      createErrorResponse('Failed to process transfer review')
    );
  }
});

/**
 * GET /api/admin/transfer-stats
 * Returns statistics about transfers for admin dashboard
 */
router.get('/transfer-stats', async (req: AuthenticatedRequest, res) => {
  try {
    console.log(`📊 Admin ${req.user?.id} requested transfer statistics`);

    const [
      pendingCount,
      pendingAmount,
      todayApproved,
      todayRejected
    ] = await Promise.all([
      // Count of pending transfers
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          status: 'PENDING',
          metadata: { path: ['transferType'], equals: 'external_bank' }
        }
      }),
      
      // Total amount pending
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'DEBIT',
          status: 'PENDING',
          metadata: { path: ['transferType'], equals: 'external_bank' }
        }
      }),
      
      // Today's approved transfers
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          status: 'COMPLETED',
          metadata: { path: ['transferType'], equals: 'external_bank' },
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      
      // Today's rejected transfers
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          status: 'REJECTED',
          metadata: { path: ['transferType'], equals: 'external_bank' },
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      })
    ]);

    const stats = {
      pending: {
        count: pendingCount,
        totalAmount: pendingAmount._sum.amount || 0
      },
      today: {
        approved: todayApproved,
        rejected: todayRejected,
        total: todayApproved + todayRejected
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(
      createSuccessResponse('Transfer statistics retrieved', stats)
    );

  } catch (error) {
    console.error('❌ Admin transfer stats error:', error);
    res.status(500).json(
      createErrorResponse('Failed to fetch transfer statistics')
    );
  }
});

export { router as adminRouter };