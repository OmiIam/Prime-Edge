import { Router } from 'express'
import { AdminService } from '../services/adminService'
import { adminUpdateUserSchema, adminUpdateBalanceSchema } from '../../shared/validation'
import { requireAuth, requireAdmin } from '../middleware/auth'

export const adminRouter = Router()

// Apply auth middleware to all admin routes
adminRouter.use(requireAuth, requireAdmin)

// GET /api/admin/dashboard - Dashboard stats
adminRouter.get('/dashboard', async (req, res) => {
  try {
    const stats = await AdminService.getDashboardStats()
    res.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/users - List all users
adminRouter.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    
    const result = await AdminService.getAllUsers(page, limit)
    res.json(result)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/users/:id - Get user details
adminRouter.get('/users/:id', async (req, res) => {
  try {
    const user = await AdminService.getUserById(req.params.id)
    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ message: error.message })
    }
    
    res.status(500).json({ message: 'Internal server error' })
  }
})

// PATCH /api/admin/users/:id - Update user
adminRouter.patch('/users/:id', async (req, res) => {
  try {
    const updates = adminUpdateUserSchema.parse(req.body)
    const user = await AdminService.updateUser(req.params.id, updates, req.user!.id)
    
    res.json({
      message: 'User updated successfully',
      user,
    })
  } catch (error) {
    console.error('Update user error:', error)
    
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ message: error.message })
    }
    
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/admin/users/:id/balance - Update user balance
adminRouter.post('/users/:id/balance', async (req, res) => {
  try {
    const balanceData = adminUpdateBalanceSchema.parse({
      ...req.body,
      userId: req.params.id,
    })
    
    const user = await AdminService.updateUserBalance(balanceData, req.user!.id)
    
    res.json({
      message: 'Balance updated successfully',
      user,
    })
  } catch (error) {
    console.error('Update balance error:', error)
    
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ message: error.message })
    }
    
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/admin/users/:id/toggle-status - Activate/Deactivate user
adminRouter.post('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await AdminService.toggleUserStatus(req.params.id, req.user!.id)
    
    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    })
  } catch (error) {
    console.error('Toggle user status error:', error)
    
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message })
    }
    
    res.status(500).json({ message: 'Internal server error' })
  }
})

// DELETE /api/admin/users/:id - Delete user
adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const result = await AdminService.deleteUser(req.params.id, req.user!.id)
    res.json(result)
  } catch (error) {
    console.error('Delete user error:', error)
    
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message })
    }
    
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/logs - Get admin action logs
adminRouter.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    
    const result = await AdminService.getAdminLogs(page, limit)
    res.json(result)
  } catch (error) {
    console.error('Get admin logs error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/pending-transfers - Get all pending external transfers
adminRouter.get('/pending-transfers', async (req, res) => {
  try {
    const { prisma } = require('../prisma')
    
    const pendingTransfers = await prisma.transaction.findMany({
      where: {
        type: 'DEBIT',
        metadata: {
          path: ['status'],
          equals: 'pending'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountNumber: true
          }
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

// POST /api/admin/approve-transfer/:id - Approve a pending external transfer
adminRouter.post('/approve-transfer/:id', async (req, res) => {
  try {
    const { prisma } = require('../prisma')
    const transferId = req.params.id
    const { action } = req.body // 'approve' or 'reject'

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: { id: true, name: true, balance: true }
        }
      }
    })

    if (!transaction) {
      return res.status(404).json({ message: 'Transfer not found' })
    }

    if (transaction.metadata?.status !== 'pending') {
      return res.status(400).json({ message: 'Transfer is not pending' })
    }

    if (action === 'approve') {
      // Check if user still has sufficient balance
      if (transaction.user.balance < transaction.amount) {
        return res.status(400).json({ 
          message: 'User has insufficient balance to complete transfer' 
        })
      }

      // Update transaction status and deduct balance
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transferId },
          data: {
            metadata: {
              ...transaction.metadata,
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: req.user!.id,
              reason: 'External bank transfer approved and processed'
            }
          }
        }),
        prisma.user.update({
          where: { id: transaction.userId },
          data: {
            balance: { decrement: transaction.amount }
          }
        })
      ])

      // Log admin action
      await AdminService.logAdminAction(
        req.user!.id,
        'APPROVE_TRANSFER',
        `Approved external transfer of $${transaction.amount} for user ${transaction.user.name}`,
        { transferId, amount: transaction.amount, userId: transaction.userId }
      )

      res.json({
        success: true,
        message: 'Transfer approved and processed successfully'
      })
    } else if (action === 'reject') {
      // Update transaction status to rejected
      await prisma.transaction.update({
        where: { id: transferId },
        data: {
          metadata: {
            ...transaction.metadata,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: req.user!.id,
            reason: req.body.reason || 'External bank transfer rejected by admin'
          }
        }
      })

      // Log admin action
      await AdminService.logAdminAction(
        req.user!.id,
        'REJECT_TRANSFER',
        `Rejected external transfer of $${transaction.amount} for user ${transaction.user.name}`,
        { transferId, amount: transaction.amount, userId: transaction.userId, reason: req.body.reason }
      )

      res.json({
        success: true,
        message: 'Transfer rejected successfully'
      })
    } else {
      res.status(400).json({ message: 'Invalid action. Use "approve" or "reject"' })
    }
  } catch (error) {
    console.error('Approve transfer error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// ============= VERIFICATION MANAGEMENT ENDPOINTS =============

// GET /api/admin/verifications/queue - Get pending verification requests
adminRouter.get('/verifications/queue', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const type = req.query.type as string // Filter by verification type
    const priority = req.query.priority as string // Filter by priority
    
    const result = await AdminService.getVerificationQueue(page, limit, { type, priority })
    res.json(result)
  } catch (error) {
    console.error('Get verification queue error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/verifications/stats - Get verification statistics
adminRouter.get('/verifications/stats', async (req, res) => {
  try {
    const stats = await AdminService.getVerificationStats()
    res.json(stats)
  } catch (error) {
    console.error('Get verification stats error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/users/:userId/verification-details - Get user's complete verification profile
adminRouter.get('/users/:userId/verification-details', async (req, res) => {
  try {
    const { userId } = req.params
    const verificationDetails = await AdminService.getUserVerificationDetails(userId)
    res.json(verificationDetails)
  } catch (error) {
    console.error('Get user verification details error:', error)
    
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ message: error.message })
    }
    
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/admin/verifications/:requestId/review - Review a verification request
adminRouter.post('/verifications/:requestId/review', async (req, res) => {
  try {
    const { requestId } = req.params
    const { action, notes, riskAssessment, documentIds } = req.body
    
    if (!['APPROVE', 'REJECT', 'REQUEST_MORE_INFO', 'ESCALATE'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' })
    }
    
    const result = await AdminService.reviewVerificationRequest({
      requestId,
      adminId: req.user!.id,
      action,
      notes,
      riskAssessment,
      documentIds: documentIds || [],
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })
    
    res.json(result)
  } catch (error) {
    console.error('Review verification error:', error)
    
    if (error instanceof Error && error.message === 'Verification request not found') {
      return res.status(404).json({ message: error.message })
    }
    
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/admin/users/:userId/create-verification-request - Create manual verification request
adminRouter.post('/users/:userId/create-verification-request', async (req, res) => {
  try {
    const { userId } = req.params
    const { verificationType, priority, notes } = req.body
    
    const request = await AdminService.createVerificationRequest({
      userId,
      requestType: verificationType,
      priority: priority || 'NORMAL',
      adminNotes: notes,
      createdBy: req.user!.id
    })
    
    res.json(request)
  } catch (error) {
    console.error('Create verification request error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/verifications/history - Get verification history with filters
adminRouter.get('/verifications/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const filters = {
      userId: req.query.userId as string,
      adminId: req.query.adminId as string,
      verificationType: req.query.verificationType as string,
      action: req.query.action as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string
    }
    
    const result = await AdminService.getVerificationHistory(page, limit, filters)
    res.json(result)
  } catch (error) {
    console.error('Get verification history error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/admin/users/:userId/bulk-verify - Bulk verify multiple items for a user
adminRouter.post('/users/:userId/bulk-verify', async (req, res) => {
  try {
    const { userId } = req.params
    const { verifications, notes } = req.body // Array of verification types to approve
    
    const results = await AdminService.bulkVerifyUser({
      userId,
      verifications,
      adminId: req.user!.id,
      notes,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })
    
    res.json(results)
  } catch (error) {
    console.error('Bulk verify user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})