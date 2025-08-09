import { Router } from 'express';
import { transferController } from '../controllers/transferController';
import { requireAuth } from '../middleware/auth';
import { getSocketService } from '../socket/socket';

export const userTransferRouter = Router();

// Apply authentication middleware to all routes
userTransferRouter.use(requireAuth);

/**
 * POST /api/user/transfer
 * Create a pending external transfer
 */
userTransferRouter.post('/transfer', async (req, res, next) => {
  try {
    // Call the controller
    await transferController.createTransfer(req as any, res);

    // If successful (status 201), emit socket event
    if (res.statusCode === 201) {
      try {
        const socketService = getSocketService();
        // The transaction data should be in the response, but we'll get it from the request user
        const userId = (req as any).user.id;
        
        // Note: In a production app, you'd want to emit the actual created transaction
        // For now, we'll let the frontend handle the optimistic update
        console.log(`Transfer created successfully for user ${userId}, socket emission handled in service layer`);
      } catch (socketError) {
        console.warn('Socket service not available:', socketError.message);
      }
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/transfer-updates
 * Get latest transfer status updates (polling fallback)
 */
userTransferRouter.get('/transfer-updates', async (req, res, next) => {
  try {
    await transferController.getTransferUpdates(req as any, res);
  } catch (error) {
    next(error);
  }
});