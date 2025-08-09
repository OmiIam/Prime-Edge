import { Router } from 'express'
import { prisma } from '../prisma'
import { requireAuth, requireOwnershipOrAdmin } from '../middleware/auth'
import { transferRateLimit, validateTransferRequest, fraudDetection } from '../middleware/transferValidation'
import { TransferService } from '../services/transferService'
import { sanitizeTransactionData, createPlainObject, createSafeJsonResponse, createErrorResponse, createSuccessResponse } from '../utils/responseUtils'
import { getSocketService } from '../services/socketService'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const userRouter = Router()

// Apply auth middleware to all user routes
userRouter.use(requireAuth)

// GET /api/user/profile - Get current user profile
userRouter.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        accountNumber: true,
        accountType: true,
        lastLogin: true,
        createdAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/user/transactions - Get user transactions
userRouter.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100) // Cap at 100
    const skip = (page - 1) * limit

    console.log('📄 Fetching transactions:', { page, limit, userId: req.user!.id });

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user!.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({
        where: { userId: req.user!.id },
      }),
    ])

    // Sanitize all transaction data
    const cleanTransactions = transactions.map(transaction => sanitizeTransactionData(transaction));

    const responseData = createPlainObject({
      transactions: cleanTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    console.log('✅ Transactions fetched successfully:', cleanTransactions.length);

    // Ensure response is properly formatted JSON
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    const errorResponse = createErrorResponse('Failed to fetch transactions', 500);
    res.status(500).json(errorResponse.body);
  }
})

// GET /api/user/dashboard - Get dashboard data
userRouter.get('/dashboard', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        accountNumber: true,
        accountType: true,
        lastLogin: true,
      },
    })

    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: req.user!.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    // Calculate monthly stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyStats = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId: req.user!.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
      _count: true,
    })

    const monthlySpent = monthlyStats.find(stat => stat.type === 'DEBIT')?._sum.amount || 0
    const monthlyReceived = monthlyStats.find(stat => stat.type === 'CREDIT')?._sum.amount || 0

    res.json({
      user,
      recentTransactions,
      monthlyStats: {
        spent: monthlySpent,
        received: monthlyReceived,
        transactionCount: monthlyStats.reduce((acc, stat) => acc + stat._count, 0),
      },
    })
  } catch (error) {
    console.error('Get dashboard error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/user/transfer - Create a transfer
userRouter.post('/transfer', async (req, res) => {
  try {
    console.log('📥 Transfer request received:', {
      body: req.body,
      headers: req.headers['content-type']
    });

    // Validate request body and content type
    if (!req.body || typeof req.body !== 'object') {
      const errorResponse = createErrorResponse('Invalid request body', 400);
      return res.status(400).json(errorResponse.body);
    }

    const { amount, recipientInfo, transferType, bankName } = req.body

    // Validate required fields
    if (!amount || !recipientInfo || !transferType) {
      const errorResponse = createErrorResponse('Amount, recipient info, and transfer type are required', 400);
      return res.status(400).json(errorResponse.body);
    }

    // Additional validation for external bank transfers
    if (transferType === 'external_bank' && !bankName) {
      const errorResponse = createErrorResponse('Bank name is required for external bank transfers', 400);
      return res.status(400).json(errorResponse.body);
    }

    // Validate amount
    const transferAmount = parseFloat(amount)
    if (isNaN(transferAmount) || transferAmount <= 0) {
      const errorResponse = createErrorResponse('Invalid transfer amount', 400);
      return res.status(400).json(errorResponse.body);
    }

    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { balance: true }
    })

    if (!user || user.balance < transferAmount) {
      const errorResponse = createErrorResponse('Insufficient funds', 400);
      return res.status(400).json(errorResponse.body);
    }

    // For external bank transfers, we need to hold the funds but not deduct them until approved
    if (transferType === 'external_bank') {
      // Check if user has sufficient balance including any pending external transfers
      const pendingExternalTransfers = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: req.user!.id,
          type: 'DEBIT',
          metadata: {
            path: ['status'],
            equals: 'pending'
          }
        }
      });
      
      const totalPending = pendingExternalTransfers._sum.amount || 0;
      if (user.balance - totalPending < transferAmount) {
        const errorResponse = createErrorResponse('Insufficient funds including pending transfers', 400);
        return res.status(400).json(errorResponse.body);
      }

      // Create transaction record with enhanced metadata
      const transaction = await prisma.transaction.create({
        data: {
          userId: req.user!.id,
          type: 'DEBIT',
          amount: transferAmount,
          description: `External bank transfer to ${bankName}`,
          status: 'PENDING',
          metadata: {
            transferType,
            recipientInfo: `Account ending in ${recipientInfo.slice(-4)}`,
            bankName,
            fullAccountInfo: recipientInfo,
            status: 'pending',
            reason: 'External bank transfer awaiting approval',
            submittedAt: new Date().toISOString(),
            requiresApproval: true,
            riskLevel: transferAmount > 10000 ? 'HIGH' : transferAmount > 5000 ? 'MEDIUM' : 'LOW',
          }
        }
      })

      // Create clean transaction data manually
      const cleanTransaction = {
        id: String(transaction.id),
        userId: String(transaction.userId),
        type: String(transaction.type),
        amount: Number(transaction.amount),
        status: String(transaction.status),
        description: String(transaction.description),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
        metadata: transaction.metadata ? JSON.parse(JSON.stringify(transaction.metadata)) : null
      };

      console.log('✅ External transfer created successfully:', cleanTransaction.id);

      // Emit WebSocket event for real-time updates
      try {
        const socketService = getSocketService();
        socketService.emitTransferPending(req.user!.id, cleanTransaction);
        console.log('🚀 Transfer pending event emitted via WebSocket');
      } catch (socketError) {
        console.warn('⚠️  WebSocket not available, falling back to polling:', socketError.message);
      }

      // Simple, clean response
      const responseData = {
        success: true,
        message: 'External bank transfer submitted for approval. You will receive a notification once processed.',
        data: {
          transaction: cleanTransaction
        }
      };

      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(responseData);
    } else {
      // Handle internal transfers - deduct immediately
      const transaction = await prisma.$transaction(async (tx) => {
        const newTransaction = await tx.transaction.create({
          data: {
            userId: req.user!.id,
            type: 'DEBIT',
            amount: transferAmount,
            description: `Internal transfer to ${transferType} account`,
            status: 'COMPLETED',
            metadata: {
              transferType,
              recipientInfo,
              status: 'completed',
              reason: 'Internal transfer',
              submittedAt: new Date().toISOString(),
              requiresApproval: false
            }
          }
        })

        await tx.user.update({
          where: { id: req.user!.id },
          data: { balance: { decrement: transferAmount } }
        })

        return newTransaction
      })

      // Create clean transaction data manually
      const cleanTransaction = {
        id: String(transaction.id),
        userId: String(transaction.userId),
        type: String(transaction.type),
        amount: Number(transaction.amount),
        status: String(transaction.status),
        description: String(transaction.description),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
        metadata: transaction.metadata ? JSON.parse(JSON.stringify(transaction.metadata)) : null
      };

      console.log('✅ Internal transfer completed successfully:', cleanTransaction.id);

      const responseData = {
        success: true,
        message: 'Transfer completed successfully',
        data: {
          transaction: cleanTransaction
        }
      };

      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(responseData);
    }

  } catch (error) {
    console.error('❌ Transfer error:', error);
    
    const errorResponse = {
      success: false,
      message: 'Internal server error',
      data: null,
      timestamp: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json(errorResponse);
  }
})

// GET /api/user/pending-transfers - Get user's pending external transfers
userRouter.get('/pending-transfers', async (req, res) => {
  try {
    const pendingTransfers = await prisma.transaction.findMany({
      where: {
        userId: req.user!.id,
        type: 'DEBIT',
        metadata: {
          path: ['status'],
          equals: 'pending'
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Sanitize pending transfers to prevent circular references
    const cleanPendingTransfers = pendingTransfers.map(transaction => sanitizeTransactionData(transaction));
    
    const responseData = createPlainObject({
      pendingTransfers: cleanPendingTransfers
    });

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Get pending transfers error:', error);
    const errorResponse = createErrorResponse('Failed to fetch pending transfers', 500);
    res.status(500).json(errorResponse.body);
  }
})

// GET /api/user/transfer-updates - Get latest transfer status updates (polling fallback)
userRouter.get('/transfer-updates', async (req, res) => {
  console.log('📡 Transfer updates requested by user:', req.user?.id || 'unknown');

  // Set headers first
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  try {
    // Validate user exists
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    
    // Simple query - just get recent transactions
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: req.user.id
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${transactions.length} transactions for user ${req.user.id}`);

    // Create the simplest possible response
    const updates = transactions.map(t => {
      try {
        return {
          id: String(t.id || ''),
          userId: String(t.userId || ''),
          type: String(t.type || ''),
          amount: Number(t.amount || 0),
          status: String(t.status || 'UNKNOWN'),
          description: String(t.description || ''),
          createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: t.updatedAt ? t.updatedAt.toISOString() : new Date().toISOString(),
          metadata: t.metadata || {}
        };
      } catch (itemError) {
        console.error('Error processing transaction item:', itemError);
        return {
          id: 'error',
          userId: req.user!.id,
          type: 'ERROR',
          amount: 0,
          status: 'ERROR',
          description: 'Error processing transaction',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {}
        };
      }
    });

    const responseData = {
      success: true,
      message: `Found ${updates.length} transfer updates`,
      data: {
        updates: updates,
        count: updates.length,
        timestamp: new Date().toISOString(),
        hasMore: transactions.length >= limit
      }
    };

    console.log(`✅ Returning ${updates.length} transfer updates`);
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Transfer updates error:', error);
    
    return res.status(200).json({
      success: true,
      message: 'No transfer updates available',
      data: {
        updates: [],
        count: 0,
        timestamp: new Date().toISOString(),
        hasMore: false
      }
    });
  }
})

// Get privacy settings
userRouter.get('/privacy', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // For now, return default privacy settings
    // In a real app, you'd have a PrivacySettings model
    const defaultSettings = {
      id: crypto.randomUUID(),
      userId,
      marketingDataSharing: false,
      analyticsTracking: true,
      personalizationData: true,
      thirdPartySharing: false,
      dataRetentionPeriod: 36,
      allowCookies: true,
      functionalCookies: true,
      analyticsCookies: false,
      marketingCookies: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update privacy settings
userRouter.patch('/privacy', async (req, res) => {
  try {
    const userId = req.user!.id;
    const settings = req.body;

    // Log privacy settings change
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SETTINGS_CHANGED',
        description: 'Privacy settings updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(settings)
        }
      }
    });

    // In a real app, you'd update the PrivacySettings model
    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user account
userRouter.delete('/account', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { password, reason, feedback } = req.body;

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Log account deletion
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SUSPICIOUS_ACTIVITY',
        description: 'Account deletion requested',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        riskLevel: 'HIGH',
        metadata: {
          reason,
          feedback
        }
      }
    });

    // In a real app, you'd implement account deletion logic
    // For demo purposes, just mark as inactive
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    res.json({ message: 'Account deletion requested successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get support settings
userRouter.get('/support/settings', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Return default support settings
    const defaultSettings = {
      id: crypto.randomUUID(),
      userId,
      preferredContactMethod: 'EMAIL',
      defaultIssueCategory: 'general',
      allowMarketing: true,
      timezone: 'America/New_York',
      language: 'en',
      availabilityHours: 'business',
      prioritySupport: req.user!.role === 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Get support settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update support settings
userRouter.patch('/support/settings', async (req, res) => {
  try {
    const userId = req.user!.id;
    const settings = req.body;

    // Log support settings change
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SETTINGS_CHANGED',
        description: 'Support settings updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(settings)
        }
      }
    });

    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update support settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get support tickets
userRouter.get('/support/tickets', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Return mock support tickets
    const mockTickets = [
      {
        id: crypto.randomUUID(),
        userId,
        subject: 'Unable to transfer funds',
        category: 'transactions',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        description: 'I am having trouble transferring money to my savings account.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 3
      },
      {
        id: crypto.randomUUID(),
        userId,
        subject: 'Security question about recent login',
        category: 'security',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        description: 'I noticed a login from a new device and want to verify it was legitimate.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        responseCount: 2
      }
    ];

    res.json({ tickets: mockTickets });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get statement settings
userRouter.get('/statements/settings', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Return default statement settings
    const defaultSettings = {
      id: crypto.randomUUID(),
      userId,
      preferredFormat: 'PDF',
      autoSubscription: true,
      deliveryMethod: 'EMAIL',
      statementFrequency: 'MONTHLY',
      includeImages: false,
      includeDetails: true,
      paperlessConsent: true,
      deliveryDay: 1,
      language: 'en',
      timezone: 'America/New_York',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: defaultSettings });
  } catch (error) {
    console.error('Get statement settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update statement settings
userRouter.patch('/statements/settings', async (req, res) => {
  try {
    const userId = req.user!.id;
    const settings = req.body;

    // Log statement settings change
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SETTINGS_CHANGED',
        description: 'Statement settings updated',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          changes: Object.keys(settings)
        }
      }
    });

    const updatedSettings = {
      ...settings,
      updatedAt: new Date().toISOString()
    };

    res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Update statement settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})