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
}