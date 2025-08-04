import { prisma } from '../prisma'
import type { AdminUpdateUserInput, AdminUpdateBalanceInput } from '../../shared/validation'

export class AdminService {
  // Get all users with pagination
  static async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          balance: true,
          accountType: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Get user by ID with transactions
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 transactions
        },
        adminLogs: {
          include: {
            admin: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 admin actions
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  // Update user details
  static async updateUser(userId: string, updates: AdminUpdateUserInput, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'USER_UPDATED',
        targetUserId: userId,
        description: `Updated user details: ${Object.keys(updates).join(', ')}`,
      },
    })

    return updatedUser
  }

  // Update user balance
  static async updateUserBalance(input: AdminUpdateBalanceInput, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const newBalance = input.action === 'ADD' 
      ? user.balance + input.amount 
      : Math.max(0, user.balance - input.amount)

    // Update balance
    const updatedUser = await prisma.user.update({
      where: { id: input.userId },
      data: { balance: newBalance },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: input.userId,
        type: input.action === 'ADD' ? 'CREDIT' : 'DEBIT',
        amount: input.amount,
        description: input.description,
        reference: `ADMIN-${Date.now()}`,
      },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'BALANCE_UPDATED',
        targetUserId: input.userId,
        amount: input.amount,
        description: `${input.action === 'ADD' ? 'Added' : 'Subtracted'} $${input.amount}: ${input.description}`,
      },
    })

    return updatedUser
  }

  // Deactivate/Activate user
  static async toggleUserStatus(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role === 'ADMIN') {
      throw new Error('Cannot deactivate admin users')
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: updatedUser.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        targetUserId: userId,
        description: `User ${updatedUser.isActive ? 'activated' : 'deactivated'}`,
      },
    })

    return updatedUser
  }

  // Delete user
  static async deleteUser(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role === 'ADMIN') {
      throw new Error('Cannot delete admin users')
    }

    // Delete user (cascading will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'USER_DELETED',
        targetUserId: null, // User is deleted
        description: `Deleted user: ${user.name} (${user.email})`,
      },
    })

    return { message: 'User deleted successfully' }
  }

  // Get admin logs
  static async getAdminLogs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        skip,
        take: limit,
        include: {
          admin: {
            select: { name: true, email: true },
          },
          targetUser: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminLog.count(),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Get dashboard stats
  static async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      totalBalance,
      recentTransactions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.user.aggregate({
        _sum: { balance: true },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ])

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalTransactions,
      totalBalance: totalBalance._sum.balance || 0,
      recentTransactions,
    }
  }

  // ============= VERIFICATION MANAGEMENT METHODS =============

  // Get pending verification requests queue
  static async getVerificationQueue(page: number = 1, limit: number = 20, filters: { type?: string, priority?: string } = {}) {
    const skip = (page - 1) * limit
    const where: any = {
      status: { in: ['PENDING', 'IN_REVIEW'] }
    }

    if (filters.type) {
      where.requestType = filters.type
    }
    if (filters.priority) {
      where.priority = filters.priority
    }

    const [requests, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              kycStatus: true,
              riskLevel: true,
              isPep: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' }, // URGENT, HIGH, NORMAL, LOW
          { requestedAt: 'asc' }  // Oldest first within same priority
        ]
      }),
      prisma.verificationRequest.count({ where })
    ])

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  // Get verification statistics for admin dashboard
  static async getVerificationStats() {
    const [
      totalPending,
      totalInReview,
      totalCompleted,
      urgentRequests,
      requestsByType,
      averageProcessingTime
    ] = await Promise.all([
      prisma.verificationRequest.count({ where: { status: 'PENDING' } }),
      prisma.verificationRequest.count({ where: { status: 'IN_REVIEW' } }),
      prisma.verificationRequest.count({ where: { status: 'APPROVED' } }),
      prisma.verificationRequest.count({ where: { priority: 'URGENT', status: { in: ['PENDING', 'IN_REVIEW'] } } }),
      prisma.verificationRequest.groupBy({
        by: ['requestType'],
        where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
        _count: true
      }),
      prisma.verificationRequest.findMany({
        where: { 
          status: 'APPROVED',
          completedAt: { not: null }
        },
        select: {
          requestedAt: true,
          completedAt: true
        },
        take: 100 // Sample for average calculation
      })
    ])

    // Calculate average processing time in hours
    const avgTime = averageProcessingTime.length > 0 
      ? averageProcessingTime.reduce((acc, req) => {
          if (req.completedAt) {
            const diff = new Date(req.completedAt).getTime() - new Date(req.requestedAt).getTime()
            return acc + (diff / (1000 * 60 * 60)) // Convert to hours
          }
          return acc
        }, 0) / averageProcessingTime.length
      : 0

    return {
      totalPending,
      totalInReview,
      totalCompleted,
      urgentRequests,
      requestsByType,
      averageProcessingTimeHours: Math.round(avgTime * 10) / 10
    }
  }

  // Get complete verification details for a specific user
  static async getUserVerificationDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        verificationRequests: {
          orderBy: { requestedAt: 'desc' }
        },
        adminVerifications: {
          include: {
            admin: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          select: {
            id: true,
            type: true,
            filename: true,
            uploadedAt: true,
            verified: true,
            verifiedAt: true,
            verifiedBy: true,
            expiresAt: true
          }
        },
        addressHistory: {
          orderBy: { startDate: 'desc' }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        // Personal info
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        placeOfBirth: user.placeOfBirth,
        nationality: user.nationality,
        // Contact info
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country,
        // Verification status
        kycStatus: user.kycStatus,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        addressVerified: user.addressVerified,
        identityVerified: user.identityVerified,
        incomeVerified: user.incomeVerified,
        // Risk info
        riskLevel: user.riskLevel,
        isPep: user.isPep,
        sanctionsCheck: user.sanctionsCheck,
        // Employment info (masked for privacy)
        employmentStatus: user.employmentStatus,
        employer: user.employer,
        annualIncome: user.annualIncome,
        // Timestamps
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      verificationRequests: user.verificationRequests,
      verificationHistory: user.adminVerifications,
      documents: user.documents,
      addressHistory: user.addressHistory
    }
  }

  // Review a verification request
  static async reviewVerificationRequest(data: {
    requestId: string
    adminId: string
    action: string
    notes?: string
    riskAssessment?: string
    documentIds: string[]
    ipAddress?: string
    userAgent?: string
  }) {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: data.requestId },
      include: { user: true }
    })

    if (!request) {
      throw new Error('Verification request not found')
    }

    const now = new Date()
    let newStatus: string
    let userUpdates: any = {}

    // Determine new status and user updates based on action
    switch (data.action) {
      case 'APPROVE':
        newStatus = 'APPROVED'
        // Update user verification status based on request type
        switch (request.requestType) {
          case 'IDENTITY':
            userUpdates.identityVerified = true
            break
          case 'ADDRESS':
            userUpdates.addressVerified = true
            break
          case 'INCOME':
            userUpdates.incomeVerified = true
            break
          case 'EMAIL':
            userUpdates.emailVerified = true
            break
          case 'PHONE':
            userUpdates.phoneVerified = true
            break
        }
        break
      case 'REJECT':
        newStatus = 'REJECTED'
        break
      case 'REQUEST_MORE_INFO':
        newStatus = 'REQUIRES_ADDITIONAL_INFO'
        break
      case 'ESCALATE':
        newStatus = 'IN_REVIEW'
        break
      default:
        throw new Error('Invalid action')
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update verification request
      const updatedRequest = await tx.verificationRequest.update({
        where: { id: data.requestId },
        data: {
          status: newStatus as any,
          adminNotes: data.notes,
          completedBy: data.adminId,
          completedAt: data.action === 'APPROVE' || data.action === 'REJECT' ? now : undefined
        }
      })

      // Update user verification status if approved
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: request.userId },
          data: userUpdates
        })
      }

      // Create admin verification record
      await tx.adminVerification.create({
        data: {
          userId: request.userId,
          adminId: data.adminId,
          verificationType: request.requestType,
          action: data.action as any,
          previousStatus: request.status as string,
          newStatus,
          documentIds: data.documentIds,
          notes: data.notes,
          riskAssessment: data.riskAssessment,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      })

      // Log admin action
      await AdminService.logAdminAction(
        data.adminId,
        `VERIFICATION_${data.action}`,
        `${data.action} ${request.requestType} verification for ${request.user.name}`,
        { requestId: data.requestId, verificationType: request.requestType, notes: data.notes }
      )

      return updatedRequest
    })

    return result
  }

  // Create a new verification request (manual)
  static async createVerificationRequest(data: {
    userId: string
    requestType: string
    priority: string
    adminNotes?: string
    createdBy: string
  }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } })
    if (!user) {
      throw new Error('User not found')
    }

    const request = await prisma.verificationRequest.create({
      data: {
        userId: data.userId,
        requestType: data.requestType as any,
        priority: data.priority,
        adminNotes: data.adminNotes,
        status: 'PENDING'
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    // Log admin action
    await AdminService.logAdminAction(
      data.createdBy,
      'VERIFICATION_REQUEST_CREATED', 
      `Created ${data.requestType} verification request for ${user.name}`,
      { requestId: request.id, verificationType: data.requestType }
    )

    return request
  }

  // Get verification history with filters
  static async getVerificationHistory(page: number = 1, limit: number = 50, filters: any = {}) {
    const skip = (page - 1) * limit
    const where: any = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.adminId) where.adminId = filters.adminId
    if (filters.verificationType) where.verificationType = filters.verificationType
    if (filters.action) where.action = filters.action
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z')
    }

    const [history, total] = await Promise.all([
      prisma.adminVerification.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          admin: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.adminVerification.count({ where })
    ])

    return {
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  // Bulk verify multiple items for a user
  static async bulkVerifyUser(data: {
    userId: string
    verifications: string[] // Array of verification types
    adminId: string
    notes?: string
    ipAddress?: string
    userAgent?: string
  }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } })
    if (!user) {
      throw new Error('User not found')
    }

    const results = await prisma.$transaction(async (tx) => {
      const updates: any = {}
      const actions = []

      // Build user updates and verification actions
      for (const verificationType of data.verifications) {
        switch (verificationType) {
          case 'IDENTITY':
            updates.identityVerified = true
            break
          case 'ADDRESS':
            updates.addressVerified = true
            break
          case 'INCOME':
            updates.incomeVerified = true
            break
          case 'EMAIL':
            updates.emailVerified = true
            break
          case 'PHONE':
            updates.phoneVerified = true
            break
        }

        // Create verification record
        actions.push(
          tx.adminVerification.create({
            data: {
              userId: data.userId,
              adminId: data.adminId,
              verificationType: verificationType as any,
              action: 'APPROVE',
              previousStatus: 'PENDING',
              newStatus: 'APPROVED',
              documentIds: [],
              notes: data.notes,
              ipAddress: data.ipAddress,
              userAgent: data.userAgent
            }
          })
        )
      }

      // Update user
      const updatedUser = await tx.user.update({
        where: { id: data.userId },
        data: updates
      })

      // Execute all verification actions
      await Promise.all(actions)

      // Log admin action
      await AdminService.logAdminAction(
        data.adminId,
        'BULK_VERIFICATION',
        `Bulk verified ${data.verifications.join(', ')} for ${user.name}`,
        { userId: data.userId, verifications: data.verifications, notes: data.notes }
      )

      return { updatedUser, verifications: data.verifications }
    })

    return results
  }

  // Helper method to log admin actions
  static async logAdminAction(
    adminId: string,
    action: string,
    description: string,
    metadata?: any
  ) {
    try {
      await prisma.adminLog.create({
        data: {
          adminId,
          action,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })
    } catch (error) {
      console.error('Failed to log admin action:', error)
      // Don't throw error to avoid blocking the main operation
    }
  }
}