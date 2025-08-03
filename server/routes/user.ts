import { Router } from 'express'
import { prisma } from '../prisma'
import { requireAuth, requireOwnershipOrAdmin } from '../middleware/auth'

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

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user!.id,
        type: 'DEBIT',
        amount: transferAmount,
        description: transferType === 'external_bank' 
          ? `External bank transfer to ${bankName} - Account ending in ${recipientInfo.slice(-4)}`
          : transferType === 'email'
          ? `Transfer to ${recipientInfo}`
          : `Internal transfer to ${transferType} account`,
        metadata: {
          transferType,
          recipientInfo,
          bankName: transferType === 'external_bank' ? bankName : undefined,
          status: transferType === 'external_bank' ? 'pending' : 'completed',
          reason: transferType === 'external_bank' ? 'External bank transfer' : 'Internal transfer'
        }
      }
    })

    // Update user balance (for non-external transfers, external ones would be processed later)
    if (transferType !== 'external_bank') {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { balance: { decrement: transferAmount } }
      })
    }

    res.json({
      success: true,
      transaction,
      message: transferType === 'external_bank' 
        ? 'External bank transfer initiated. Processing may take 1-3 business days.'
        : 'Transfer completed successfully'
    })
  } catch (error) {
    console.error('Transfer error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})