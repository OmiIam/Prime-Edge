import { Router } from 'express';
import { authenticateToken, transferRateLimit } from '../middleware/auth';
import { userTransferController } from '../controllers/transferController';

export const userTransferRouter = Router();

// Apply authentication to all routes
userTransferRouter.use(authenticateToken);

/**
 * POST /api/user/transfer
 * Create a new external bank transfer
 * 
 * Request body:
 * {
 *   amount: number,
 *   currency?: string,
 *   recipientInfo: {
 *     name: string,
 *     accountNumber: string,
 *     bankCode: string
 *   },
 *   description?: string
 * }
 * 
 * Response: 201 with sanitized transaction
 * Behavior: validate payload, create pending transaction, emit 'transfer_pending' to user room
 */
userTransferRouter.post(
  '/transfer', 
  transferRateLimit,
  userTransferController.createTransfer.bind(userTransferController)
);

/**
 * GET /api/user/transfer-updates
 * Get latest external transfers for authenticated user (polling fallback)
 * 
 * Query params:
 * - limit?: number (default 20, max 100)
 * - since?: ISO timestamp (return transfers updated after this time)
 * 
 * Response: 200 with array of sanitized transactions
 * Behavior: return latest external transfers for user, always JSON
 */
userTransferRouter.get(
  '/transfer-updates',
  userTransferController.getTransferUpdates.bind(userTransferController)
);