import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { adminTransferController } from '../controllers/transferController';

export const adminTransferRouter = Router();

// Apply authentication and admin authorization to all routes
adminTransferRouter.use(authenticateToken);
adminTransferRouter.use(requireAdmin);

/**
 * GET /api/admin/pending-transfers
 * List all pending external transfers for admin review
 * 
 * Query params:
 * - page?: number (default 1)
 * - limit?: number (default 20, max 100)
 * 
 * Response: 200 with paginated pending transfers, sanitized, include user id/email
 * Behavior: paginated pending transfers with user info
 */
adminTransferRouter.get(
  '/pending-transfers',
  adminTransferController.getPendingTransfers.bind(adminTransferController)
);

/**
 * POST /api/admin/transfer/:id/approve
 * Approve a pending transfer
 * 
 * Request body:
 * {
 *   adminNotes?: string
 * }
 * 
 * Response: 200 with updated transaction
 * Behavior: verify pending, set processing, call/enqueue bank transfer, 
 * on success set completed with externalRef + audit adminId, emit 'transfer_update' to user
 */
adminTransferRouter.post(
  '/transfer/:id/approve',
  adminTransferController.approveTransfer.bind(adminTransferController)
);

/**
 * POST /api/admin/transfer/:id/reject
 * Reject a pending transfer
 * 
 * Request body:
 * {
 *   rejectionReason: string (required)
 * }
 * 
 * Response: 200 with updated transaction
 * Behavior: verify pending, set rejected + store reason + audit adminId, emit 'transfer_update' to user
 */
adminTransferRouter.post(
  '/transfer/:id/reject',
  adminTransferController.rejectTransfer.bind(adminTransferController)
);

/**
 * GET /api/admin/transfer-stats
 * Get transfer statistics for admin dashboard
 * 
 * Response: 200 with transfer counts and total volume
 * Behavior: return statistics for pending, processing, completed, rejected, failed transfers
 */
adminTransferRouter.get(
  '/transfer-stats',
  adminTransferController.getTransferStats.bind(adminTransferController)
);