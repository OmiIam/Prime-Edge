import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

/**
 * JWT Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        data: null
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Auth] JWT_SECRET environment variable not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        data: null
      });
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        data: null
      });
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      role: user.role as string,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      data: null
    });
  }
}

/**
 * Admin authorization middleware
 * Must be used after authenticateToken middleware
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      data: null
    });
  }

  if (authReq.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      data: null
    });
  }

  next();
}

/**
 * Rate limiting middleware for transfer operations
 */
export function transferRateLimit(req: Request, res: Response, next: NextFunction) {
  // Simple in-memory rate limiting - in production use Redis
  // For now, just log and continue
  const authReq = req as AuthenticatedRequest;
  console.log(`[RateLimit] Transfer operation by user: ${authReq.user?.id || 'unknown'}`);
  next();
}

/**
 * Alias for authenticateToken for backwards compatibility
 */
export const requireAuth = authenticateToken;