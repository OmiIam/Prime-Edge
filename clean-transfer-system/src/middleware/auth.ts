/**
 * JWT Authentication Middleware
 * Validates JWT tokens and attaches user information to requests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    balance: number;
  };
}

/**
 * Middleware to authenticate JWT tokens and populate req.user
 * Usage: app.use(requireAuth) or router-specific protection
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        data: null
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    if (!decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format',
        data: null
      });
      return;
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        data: null
      });
      return;
    }

    // Attach user to request for use in route handlers
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        data: null
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication service error',
        data: null
      });
    }
  }
};

/**
 * Middleware to require admin role after authentication
 * Must be used after requireAuth middleware
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      data: null
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      data: null
    });
    return;
  }

  next();
};

/**
 * Utility function to generate JWT tokens for authenticated users
 */
export const generateToken = (user: { id: string; email: string; role: string }): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};