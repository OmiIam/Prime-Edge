import { Router } from 'express'
import { AdminService } from '../services/adminService'
import { adminUpdateUserSchema, adminUpdateBalanceSchema } from '../../shared/validation'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { adminActionRateLimit, validateAdminReview } from '../middleware/transferValidation'
import { sanitizeTransactionData, createSuccessResponse, createErrorResponse } from '../utils/responseUtils'
import { getSocketService } from '../services/socketService'
import adminKycRouter from './admin/kyc'

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

// POST /api/admin/transfers/:id/review - Review a pending external transfer
adminRouter.post('/transfers/:id/review', [
  adminActionRateLimit,
  validateAdminReview
], async (req, res) => {
  try {
    const { prisma } = require('../prisma')
    const transferId = req.params.id
    const { action, reason } = req.body // 'approve' or 'reject'

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject"' })
    }

    // Get the transaction with user info
    const transaction = await prisma.transaction.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: { id: true, name: true, email: true, balance: true }
        }
      }
    })

    if (!transaction) {
      return res.status(404).json({ message: 'Transfer not found' })
    }

    if (transaction.metadata?.status !== 'pending') {
      return res.status(400).json({ message: 'Transfer is not pending approval' })
    }

    const currentTimestamp = new Date().toISOString()
    const adminId = req.user!.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')

    if (action === 'approve') {
      // Validate user still has sufficient balance
      if (transaction.user.balance < transaction.amount) {
        return res.status(400).json({ 
          message: 'User has insufficient balance to complete transfer' 
        })
      }

      // Process the approval in a database transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update transaction status to approved and completed
        const updatedTransaction = await tx.transaction.update({
          where: { id: transferId },
          data: {
            status: 'COMPLETED',
            metadata: {
              ...transaction.metadata,
              status: 'approved',
              approvedAt: currentTimestamp,
              approvedBy: adminId,
              processedAt: currentTimestamp,
              reason: reason || 'External bank transfer approved and processed by admin',
              adminNotes: reason
            }
          }
        })

        // Deduct funds from user balance
        const updatedUser = await tx.user.update({
          where: { id: transaction.userId },
          data: {
            balance: { decrement: transaction.amount }
          }
        })

        // Log admin action for audit trail
        await tx.adminLog.create({
          data: {
            adminId,
            action: 'APPROVE_TRANSFER',
            targetUserId: transaction.userId,
            amount: transaction.amount,
            description: `Approved external bank transfer of $${transaction.amount.toFixed(2)} to ${transaction.metadata?.bankName}`,
          }
        })

        // Create security event for the user
        await tx.securityEvent.create({
          data: {
            userId: transaction.userId,
            eventType: 'SUSPICIOUS_ACTIVITY', // Using existing enum
            description: `External transfer of $${transaction.amount.toFixed(2)} approved and processed`,
            ipAddress,
            userAgent,
            riskLevel: 'LOW',
            metadata: {
              transferId,
              adminId,
              bankName: transaction.metadata?.bankName,
              approvedAt: currentTimestamp
            }
          }
        })

        return { updatedTransaction, updatedUser }
      })

      // Emit real-time WebSocket event to user about approval
      try {
        const socketService = getSocketService();
        socketService.emitTransferUpdate(
          transaction.userId, 
          result.updatedTransaction, 
          'approved',
          reason || 'Transfer approved and processed by admin'
        );
        console.log(`🎉 Transfer approval event emitted to user ${transaction.userId}`);
      } catch (socketError) {
        console.warn('⚠️  WebSocket not available for transfer approval notification:', socketError.message);
      }

      // TODO: In production, integrate with actual bank transfer API here
      // await externalBankTransferService.processTransfer({
      //   amount: transaction.amount,
      //   bankName: transaction.metadata?.bankName,
      //   accountInfo: transaction.metadata?.fullAccountInfo,
      //   transactionId: transferId
      // })

      const sanitizedTransaction = sanitizeTransactionData(result.updatedTransaction);
      const successResponse = createSuccessResponse(
        { transaction: sanitizedTransaction },
        'Transfer approved and funds processed successfully'
      );

      res.status(200).json(successResponse.body);

    } else if (action === 'reject') {
      // Process the rejection
      const result = await prisma.$transaction(async (tx) => {
        // Update transaction status to rejected/failed
        const updatedTransaction = await tx.transaction.update({
          where: { id: transferId },
          data: {
            status: 'FAILED',
            metadata: {
              ...transaction.metadata,
              status: 'rejected',
              rejectedAt: currentTimestamp,
              rejectedBy: adminId,
              reason: reason || 'External bank transfer rejected by admin review',
              adminNotes: reason
            }
          }
        })

        // Log admin action for audit trail
        await tx.adminLog.create({
          data: {
            adminId,
            action: 'REJECT_TRANSFER',
            targetUserId: transaction.userId,
            amount: transaction.amount,
            description: `Rejected external bank transfer of $${transaction.amount.toFixed(2)} to ${transaction.metadata?.bankName}. Reason: ${reason || 'No reason provided'}`,
          }
        })

        // Create security event for the user
        await tx.securityEvent.create({
          data: {
            userId: transaction.userId,
            eventType: 'SUSPICIOUS_ACTIVITY',
            description: `External transfer of $${transaction.amount.toFixed(2)} rejected`,
            ipAddress,
            userAgent,
            riskLevel: 'MEDIUM',
            metadata: {
              transferId,
              adminId,
              bankName: transaction.metadata?.bankName,
              rejectedAt: currentTimestamp,
              rejectionReason: reason
            }
          }
        })

        return { updatedTransaction }
      })

      // Emit real-time WebSocket event to user about rejection
      try {
        const socketService = getSocketService();
        socketService.emitTransferUpdate(
          transaction.userId, 
          result.updatedTransaction, 
          'rejected',
          reason || 'Transfer rejected by admin review'
        );
        console.log(`❌ Transfer rejection event emitted to user ${transaction.userId}`);
      } catch (socketError) {
        console.warn('⚠️  WebSocket not available for transfer rejection notification:', socketError.message);
      }

      const sanitizedTransaction = sanitizeTransactionData(result.updatedTransaction);
      const successResponse = createSuccessResponse(
        { transaction: sanitizedTransaction },
        'Transfer rejected successfully'
      );

      res.status(200).json(successResponse.body);
    }
  } catch (error) {
    console.error('Transfer review error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/admin/transfers/stats - Get transfer statistics
adminRouter.get('/transfers/stats', async (req, res) => {
  try {
    const { prisma } = require('../prisma')
    
    const stats = await Promise.all([
      // Total pending transfers
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          metadata: { path: ['status'], equals: 'pending' }
        }
      }),
      
      // Total pending amount
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'DEBIT',
          metadata: { path: ['status'], equals: 'pending' }
        }
      }),
      
      // Approved transfers today
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          metadata: { path: ['status'], equals: 'approved' },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      
      // Rejected transfers today
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          metadata: { path: ['status'], equals: 'rejected' },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      })
    ])

    res.json({
      pendingCount: stats[0],
      pendingAmount: stats[1]._sum.amount || 0,
      approvedToday: stats[2],
      rejectedToday: stats[3]
    })
  } catch (error) {
    console.error('Transfer stats error:', error)
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

// Mount KYC admin routes
adminRouter.use('/kyc', adminKycRouter)