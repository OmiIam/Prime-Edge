import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/authService'

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        name: string
        email: string
        role: 'USER' | 'ADMIN'
        balance: number
      }
    }
  }
}

// Middleware to require authentication
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' })
    }

    const user = await AuthService.verifyToken(token)
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Middleware to require admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' })
  }

  next()
}

// Middleware to require user to access their own data or admin
export function requireOwnershipOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const targetUserId = req.params.userId || req.body.userId
  
  if (req.user.role === 'ADMIN' || req.user.id === targetUserId) {
    next()
  } else {
    return res.status(403).json({ message: 'Access denied' })
  }
}