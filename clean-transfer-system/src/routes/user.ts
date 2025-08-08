/**
 * User Transfer Routes
 * Handles transfer creation and status updates for authenticated users
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { 
  sanitizeTransactionData, 
  createSuccessResponse, 
  createErrorResponse 
} from '../utils/sanitizer';
import { getSocketService } from '../services/socketService';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(requireAuth);

/**
 * POST /api/user/transfer
 * Creates a pending external bank transfer for the authenticated user
 */
router.post('/transfer', async (req: AuthenticatedRequest, res) => {
  try {
    console.log(`📤 Transfer request from user: ${req.user?.id}`);

    const { amount, recipientInfo, bankName, description } = req.body;

    // Input validation
    if (!amount || !recipientInfo || !bankName) {
      return res.status(400).json(
        createErrorResponse('Amount, recipient info, and bank name are required')
      );
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json(
        createErrorResponse('Invalid transfer amount')
      );
    }

    // Business rules validation
    if (transferAmount > 10000) {
      return res.status(400).json(
        createErrorResponse('Transfer amount exceeds daily limit of $10,000')
      );
    }

    // Check user balance
    if (req.user!.balance < transferAmount) {
      return res.status(400).json(
        createErrorResponse('Insufficient funds')
      );
    }

    // Check for pending transfers that would affect available balance
    const pendingAmount = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId: req.user!.id,
        type: 'DEBIT',
        status: 'PENDING'
      }
    });

    const availableBalance = req.user!.balance - (pendingAmount._sum.amount || 0);
    if (availableBalance < transferAmount) {
      return res.status(400).json(
        createErrorResponse('Insufficient funds including pending transfers')
      );
    }

    // Create transfer transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user!.id,
        type: 'DEBIT',
        amount: transferAmount,
        status: 'PENDING',
        description: description || `External bank transfer to ${bankName}`,
        metadata: {
          transferType: 'external_bank',
          recipientInfo: recipientInfo.slice(-4), // Only store last 4 digits for security
          bankName: bankName,
          fullAccountInfo: recipientInfo, // Store full info for processing
          riskLevel: transferAmount > 5000 ? 'HIGH' : 'MEDIUM',
          requiresApproval: true,
          submittedAt: new Date().toISOString()
        }
      }
    });

    console.log(`✅ Transfer created: ${transaction.id} for $${transferAmount}`);

    // Emit WebSocket event for real-time updates
    try {
      const socketService = getSocketService();
      socketService.emitTransferPending(req.user!.id, transaction);
      console.log(`📡 WebSocket event emitted: transfer_pending`);
    } catch (socketError) {
      console.warn('⚠️ WebSocket unavailable, using polling fallback:', socketError.message);
    }

    // Sanitize and return response
    const sanitizedTransaction = sanitizeTransactionData(transaction);
    
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(
      createSuccessResponse(
        'Transfer submitted successfully. Pending admin approval.',
        { transaction: sanitizedTransaction }
      )
    );

  } catch (error) {
    console.error('❌ Transfer creation error:', error);
    res.status(500).json(
      createErrorResponse('Failed to create transfer')
    );
  }
});

/**
 * GET /api/user/transfer-updates
 * Returns latest transaction updates for the authenticated user, filtered to external transfers
 */
router.get('/transfer-updates', async (req: AuthenticatedRequest, res) => {
  try {
    console.log(`📡 Transfer updates requested by user: ${req.user?.id}`);

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const since = req.query.since as string;

    // Build query conditions
    const whereCondition: any = {
      userId: req.user!.id,
      type: 'DEBIT',
      metadata: {
        path: ['transferType'],
        equals: 'external_bank'
      }
    };

    // Optional timestamp filtering for efficient polling
    if (since) {
      try {
        const sinceDate = new Date(since);
        if (!isNaN(sinceDate.getTime())) {
          whereCondition.updatedAt = { gt: sinceDate };
        }
      } catch (dateError) {
        console.warn('Invalid since timestamp:', since);
      }
    }

    // Fetch external transfers only
    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      take: limit,
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`📊 Found ${transactions.length} transfer updates`);

    // Sanitize all transaction data
    const sanitizedTransactions = transactions.map(sanitizeTransactionData);

    // Return consistent JSON response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json(
      createSuccessResponse(
        `Found ${sanitizedTransactions.length} transfer updates`,
        {
          updates: sanitizedTransactions,
          count: sanitizedTransactions.length,
          timestamp: new Date().toISOString(),
          hasMore: transactions.length >= limit
        }
      )
    );

  } catch (error) {
    console.error('❌ Transfer updates error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json(
      createErrorResponse('Failed to fetch transfer updates')
    );
  }
});

/**
 * GET /api/user/transactions
 * Returns paginated transaction history for the authenticated user
 */
router.get('/transactions', async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user!.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({
        where: { userId: req.user!.id }
      })
    ]);

    const sanitizedTransactions = transactions.map(sanitizeTransactionData);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(
      createSuccessResponse(
        'Transaction history retrieved',
        {
          transactions: sanitizedTransactions,
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
    console.error('❌ Transaction history error:', error);
    res.status(500).json(
      createErrorResponse('Failed to fetch transaction history')
    );
  }
});

export { router as userRouter };