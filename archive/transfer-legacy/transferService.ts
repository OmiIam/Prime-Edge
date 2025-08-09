import { prisma } from '../prisma'
import { z } from 'zod'

// Validation schemas
export const transferValidationSchema = z.object({
  amount: z.number().positive().max(50000), // Daily limit
  recipientInfo: z.string().min(1),
  transferType: z.enum(['checking', 'savings', 'external_bank']),
  bankName: z.string().optional(),
})

export const transferReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

export interface TransferReviewRequest {
  transferId: string
  adminId: string
  action: 'approve' | 'reject'
  reason?: string
  ipAddress?: string
  userAgent?: string
}

export class TransferService {
  /**
   * Create a pending external bank transfer
   */
  static async createExternalTransfer(userId: string, transferData: {
    amount: number
    recipientInfo: string
    bankName: string
    ipAddress?: string
    userAgent?: string
  }) {
    const { amount, recipientInfo, bankName, ipAddress, userAgent } = transferData

    // Validate user exists and has sufficient balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, balance: true, isActive: true }
    })

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive')
    }

    // Check available balance including pending transfers
    const pendingTransfersTotal = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: 'DEBIT',
        metadata: { path: ['status'], equals: 'pending' }
      }
    })

    const availableBalance = user.balance - (pendingTransfersTotal._sum.amount || 0)
    if (availableBalance < amount) {
      throw new Error('Insufficient available balance including pending transfers')
    }

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'DEBIT',
        amount,
        description: `External bank transfer to ${bankName}`,
        status: 'PENDING',
        metadata: {
          transferType: 'external_bank',
          recipientInfo: `Account ending in ${recipientInfo.slice(-4)}`,
          bankName,
          fullAccountInfo: recipientInfo, // Store full info securely
          status: 'pending',
          reason: 'External bank transfer awaiting admin approval',
          submittedAt: new Date().toISOString(),
          requiresApproval: true,
          riskLevel: amount > 10000 ? 'HIGH' : amount > 5000 ? 'MEDIUM' : 'LOW',
          userAgent,
          ipAddress
        }
      }
    })

    // Log security event
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'SUSPICIOUS_ACTIVITY',
        description: `External bank transfer request submitted for $${amount.toFixed(2)}`,
        ipAddress,
        userAgent,
        riskLevel: amount > 10000 ? 'HIGH' : amount > 5000 ? 'MEDIUM' : 'LOW',
        metadata: {
          transferId: transaction.id,
          bankName,
          amount,
          pendingApproval: true
        }
      }
    })

    return transaction
  }

  /**
   * Get all pending transfers for admin review
   */
  static async getPendingTransfers(page = 1, limit = 10, filters: {
    riskLevel?: string
    amountMin?: number
    amountMax?: number
    dateFrom?: string
    dateTo?: string
  } = {}) {
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {
      type: 'DEBIT',
      metadata: { path: ['status'], equals: 'pending' }
    }

    if (filters.amountMin || filters.amountMax) {
      where.amount = {}
      if (filters.amountMin) where.amount.gte = filters.amountMin
      if (filters.amountMax) where.amount.lte = filters.amountMax
    }

    if (filters.riskLevel) {
      where.metadata.path = ['riskLevel']
      where.metadata.equals = filters.riskLevel
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
    }

    const [transfers, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              accountNumber: true,
              balance: true,
              riskLevel: true,
              kycStatus: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' }
        ]
      }),
      prisma.transaction.count({ where })
    ])

    // Calculate risk scores and priorities
    const enhancedTransfers = transfers.map(transfer => {
      const riskFactors = []
      let riskScore = 0

      // Amount-based risk
      if (transfer.amount > 10000) {
        riskScore += 3
        riskFactors.push('High amount')
      } else if (transfer.amount > 5000) {
        riskScore += 2
        riskFactors.push('Medium amount')
      }

      // User risk level
      if (transfer.user.riskLevel === 'HIGH') {
        riskScore += 3
        riskFactors.push('High-risk user')
      } else if (transfer.user.riskLevel === 'MEDIUM') {
        riskScore += 1
        riskFactors.push('Medium-risk user')
      }

      // KYC status
      if (transfer.user.kycStatus !== 'APPROVED') {
        riskScore += 2
        riskFactors.push('Unverified KYC')
      }

      // Time-based urgency
      const hoursSinceCreated = (Date.now() - new Date(transfer.createdAt).getTime()) / (1000 * 60 * 60)
      const urgency = hoursSinceCreated > 24 ? 'HIGH' : hoursSinceCreated > 8 ? 'MEDIUM' : 'LOW'

      return {
        ...transfer,
        riskScore,
        riskFactors,
        urgency,
        priority: riskScore > 4 ? 'URGENT' : riskScore > 2 ? 'HIGH' : 'NORMAL'
      }
    })

    return {
      transfers: enhancedTransfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Review and approve/reject a transfer
   */
  static async reviewTransfer(reviewData: TransferReviewRequest) {
    const { transferId, adminId, action, reason, ipAddress, userAgent } = reviewData

    const transaction = await prisma.transaction.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: { id: true, name: true, email: true, balance: true }
        }
      }
    })

    if (!transaction) {
      throw new Error('Transfer not found')
    }

    if (transaction.metadata?.status !== 'pending') {
      throw new Error('Transfer is not pending approval')
    }

    const currentTimestamp = new Date().toISOString()

    if (action === 'approve') {
      // Validate sufficient balance
      if (transaction.user.balance < transaction.amount) {
        throw new Error('User has insufficient balance to complete transfer')
      }

      // Process approval
      const result = await prisma.$transaction(async (tx) => {
        // Update transaction
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
              reason: reason || 'External bank transfer approved by admin',
              adminNotes: reason
            }
          }
        })

        // Deduct balance
        await tx.user.update({
          where: { id: transaction.userId },
          data: { balance: { decrement: transaction.amount } }
        })

        // Log admin action
        await tx.adminLog.create({
          data: {
            adminId,
            action: 'APPROVE_TRANSFER',
            targetUserId: transaction.userId,
            amount: transaction.amount,
            description: `Approved external transfer of $${transaction.amount.toFixed(2)} to ${transaction.metadata?.bankName}`
          }
        })

        // Create security event
        await tx.securityEvent.create({
          data: {
            userId: transaction.userId,
            eventType: 'SUSPICIOUS_ACTIVITY',
            description: `External transfer approved and processed: $${transaction.amount.toFixed(2)}`,
            ipAddress,
            userAgent,
            riskLevel: 'LOW',
            metadata: {
              transferId,
              adminId,
              approvedAt: currentTimestamp
            }
          }
        })

        return updatedTransaction
      })

      // TODO: Integrate with external bank API
      // await this.processExternalBankTransfer(transaction)

      return { success: true, transaction: result, message: 'Transfer approved and processed' }

    } else if (action === 'reject') {
      // Process rejection
      const result = await prisma.$transaction(async (tx) => {
        // Update transaction
        const updatedTransaction = await tx.transaction.update({
          where: { id: transferId },
          data: {
            status: 'FAILED',
            metadata: {
              ...transaction.metadata,
              status: 'rejected',
              rejectedAt: currentTimestamp,
              rejectedBy: adminId,
              reason: reason || 'External bank transfer rejected by admin',
              adminNotes: reason
            }
          }
        })

        // Log admin action
        await tx.adminLog.create({
          data: {
            adminId,
            action: 'REJECT_TRANSFER',
            targetUserId: transaction.userId,
            amount: transaction.amount,
            description: `Rejected external transfer of $${transaction.amount.toFixed(2)}. Reason: ${reason || 'No reason provided'}`
          }
        })

        // Create security event
        await tx.securityEvent.create({
          data: {
            userId: transaction.userId,
            eventType: 'SUSPICIOUS_ACTIVITY',
            description: `External transfer rejected: $${transaction.amount.toFixed(2)}`,
            ipAddress,
            userAgent,
            riskLevel: 'MEDIUM',
            metadata: {
              transferId,
              adminId,
              rejectedAt: currentTimestamp,
              rejectionReason: reason
            }
          }
        })

        return updatedTransaction
      })

      return { success: true, transaction: result, message: 'Transfer rejected' }
    }

    throw new Error('Invalid action')
  }

  /**
   * Get transfer statistics for admin dashboard
   */
  static async getTransferStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)
    
    const thisMonth = new Date()
    thisMonth.setMonth(thisMonth.getMonth() - 1)

    const stats = await Promise.all([
      // Pending transfers
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          metadata: { path: ['status'], equals: 'pending' }
        }
      }),
      
      // Pending amount
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: 'DEBIT',
          metadata: { path: ['status'], equals: 'pending' }
        }
      }),
      
      // Today's approved
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          metadata: { path: ['status'], equals: 'approved' },
          createdAt: { gte: today }
        }
      }),
      
      // Today's rejected
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          metadata: { path: ['status'], equals: 'rejected' },
          createdAt: { gte: today }
        }
      }),
      
      // This week's volume
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          type: 'DEBIT',
          metadata: { path: ['status'], in: ['approved', 'rejected'] },
          createdAt: { gte: thisWeek }
        }
      }),
      
      // High-risk pending transfers
      prisma.transaction.count({
        where: {
          type: 'DEBIT',
          metadata: { 
            path: ['status'], 
            equals: 'pending' 
          },
          OR: [
            { amount: { gte: 10000 } },
            {
              user: {
                riskLevel: 'HIGH'
              }
            }
          ]
        }
      })
    ])

    return {
      pending: {
        count: stats[0],
        amount: stats[1]._sum.amount || 0
      },
      today: {
        approved: stats[2],
        rejected: stats[3]
      },
      thisWeek: {
        count: stats[4]._count,
        amount: stats[4]._sum.amount || 0
      },
      highRiskPending: stats[5]
    }
  }

  /**
   * Get user's pending transfers
   */
  static async getUserPendingTransfers(userId: string) {
    return prisma.transaction.findMany({
      where: {
        userId,
        type: 'DEBIT',
        metadata: { path: ['status'], equals: 'pending' }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Placeholder for external bank transfer integration
   */
  private static async processExternalBankTransfer(transaction: any) {
    // TODO: Integrate with actual bank transfer APIs
    // Examples: ACH network, wire transfer services, etc.
    
    console.log(`Processing external bank transfer:`, {
      transferId: transaction.id,
      amount: transaction.amount,
      bankName: transaction.metadata?.bankName,
      // Don't log full account info for security
    })
    
    // In production, this would:
    // 1. Call external bank API
    // 2. Handle responses and update transaction accordingly
    // 3. Handle failures and retries
    // 4. Send notifications to user
    
    return { success: true, externalTransactionId: `ext_${Date.now()}` }
  }
}