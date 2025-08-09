import { Router } from 'express';
import { adminTransferController } from '../controllers/transferController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getSocketService } from '../socket/socket';

export const adminTransferRouter = Router();

// Apply authentication middleware to all routes
adminTransferRouter.use(requireAuth);
adminTransferRouter.use(requireAdmin);

/**
 * GET /api/admin/pending-transfers
 * List all pending external transfers for admin review
 */
adminTransferRouter.get('/pending-transfers', async (req, res, next) => {
  try {
    await adminTransferController.getPendingTransfers(req as any, res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/transfer/:id/approve
 * Approve a pending transfer
 */
adminTransferRouter.post('/transfer/:id/approve', async (req, res, next) => {
  try {
    // Store original response json method to capture the response
    const originalJson = res.json;
    let responseData: any = null;

    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    await adminTransferController.approveTransfer(req as any, res);

    // If successful, emit socket event to user
    if (res.statusCode === 200 && responseData?.success && responseData?.data?.transaction) {
      try {
        const socketService = getSocketService();
        const transaction = responseData.data.transaction;
        
        if (transaction.userId) {
          socketService.emitTransferUpdate(transaction.userId, transaction);
          console.log(`Transfer approval socket event emitted for user ${transaction.userId}`);
        }
      } catch (socketError) {
        console.warn('Socket service not available for approval notification:', socketError.message);
      }
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/transfer/:id/reject
 * Reject a pending transfer
 */
adminTransferRouter.post('/transfer/:id/reject', async (req, res, next) => {
  try {
    // Store original response json method to capture the response
    const originalJson = res.json;
    let responseData: any = null;

    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    await adminTransferController.rejectTransfer(req as any, res);

    // If successful, emit socket event to user
    if (res.statusCode === 200 && responseData?.success && responseData?.data?.transaction) {
      try {
        const socketService = getSocketService();
        const transaction = responseData.data.transaction;
        
        if (transaction.userId) {
          socketService.emitTransferUpdate(transaction.userId, transaction);
          console.log(`Transfer rejection socket event emitted for user ${transaction.userId}`);
        }
      } catch (socketError) {
        console.warn('Socket service not available for rejection notification:', socketError.message);
      }
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/transfer-stats
 * Get transfer statistics for admin dashboard
 */
adminTransferRouter.get('/transfer-stats', async (req, res, next) => {
  try {
    await adminTransferController.getTransferStats(req as any, res);
  } catch (error) {
    next(error);
  }
});