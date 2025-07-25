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