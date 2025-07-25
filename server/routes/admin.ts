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