import { Router } from 'express'
import { prisma } from '../prisma'
import { requireAuth, requireOwnershipOrAdmin } from '../middleware/auth'
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
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

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

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ message: 'Internal server error' })
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
    const { amount, recipientInfo, transferType, bankName } = req.body

    // Validate required fields
    if (!amount || !recipientInfo || !transferType) {
      return res.status(400).json({ message: 'Amount, recipient info, and transfer type are required' })
    }

    // Additional validation for external bank transfers
    if (transferType === 'external_bank' && !bankName) {
      return res.status(400).json({ message: 'Bank name is required for external bank transfers' })
    }

    // Validate amount
    const transferAmount = parseFloat(amount)
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ message: 'Invalid transfer amount' })
    }

    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { balance: true }
    })

    if (!user || user.balance < transferAmount) {
      return res.status(400).json({ message: 'Insufficient funds' })
    }

    // For external bank transfers, we need to hold the funds but not deduct them until approved
    let balanceUpdate = {};
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
        return res.status(400).json({ 
          message: 'Insufficient funds including pending transfers' 
        });
      }
    } else {
      // For internal transfers, deduct immediately
      balanceUpdate = { balance: { decrement: transferAmount } };
    }

    // Create transaction record with enhanced metadata
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user!.id,
        type: 'DEBIT',
        amount: transferAmount,
        description: transferType === 'external_bank' 
          ? `External bank transfer to ${bankName}`
          : transferType === 'email'
          ? `Transfer to ${recipientInfo}`
          : `Internal transfer to ${transferType} account`,
        metadata: {
          transferType,
          recipientInfo: transferType === 'external_bank' 
            ? `Account ending in ${recipientInfo.slice(-4)}` 
            : recipientInfo,
          bankName: transferType === 'external_bank' ? bankName : undefined,
          fullAccountInfo: transferType === 'external_bank' ? recipientInfo : undefined,
          status: transferType === 'external_bank' ? 'pending' : 'completed',
          reason: transferType === 'external_bank' ? 'External bank transfer awaiting approval' : 'Internal transfer',
          submittedAt: new Date().toISOString(),
          requiresApproval: transferType === 'external_bank'
        }
      }
    })

    // Update user balance for internal transfers only
    if (transferType !== 'external_bank') {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: balanceUpdate
      })
    }

    res.json({
      success: true,
      transaction,
      message: transferType === 'external_bank' 
        ? 'External bank transfer submitted for approval. You will receive a notification once processed.'
        : 'Transfer completed successfully'
    })
  } catch (error) {
    console.error('Transfer error:', error)
    res.status(500).json({ message: 'Internal server error' })
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

    res.json(pendingTransfers)
  } catch (error) {
    console.error('Get pending transfers error:', error)
    res.status(500).json({ message: 'Internal server error' })
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