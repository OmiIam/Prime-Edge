import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import rateLimit from 'express-rate-limit';

// Validation schemas
export const transferRequestSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(50000, 'Daily transfer limit is $50,000')
    .min(1, 'Minimum transfer amount is $1'),
  recipientInfo: z.string()
    .min(1, 'Recipient information is required')
    .max(500, 'Recipient information too long'),
  transferType: z.enum(['checking', 'savings', 'external_bank'], {
    errorMap: () => ({ message: 'Invalid transfer type' })
  }),
  bankName: z.string().optional().refine((val, ctx) => {
    if (ctx.parent.transferType === 'external_bank' && !val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bank name is required for external transfers'
      });
      return false;
    }
    return true;
  })
});

export const adminReviewSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Invalid action. Must be "approve" or "reject"' })
  }),
  reason: z.string().optional().refine((val, ctx) => {
    if (ctx.parent.action === 'reject' && !val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reason is required when rejecting a transfer'
      });
      return false;
    }
    return true;
  })
});

// Rate limiting for transfer endpoints
export const transferRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 transfer requests per windowMs
  message: {
    error: 'Too many transfer requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminActionRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 admin actions per windowMs
  message: {
    error: 'Too many admin actions from this IP, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Transfer validation middleware
export const validateTransferRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = transferRequestSchema.parse(req.body);
    
    // Additional business logic validations
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { 
        id: true, 
        balance: true, 
        isActive: true, 
        kycStatus: true,
        riskLevel: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ 
        message: 'Account is not active or not found' 
      });
    }

    // Check KYC requirements for large transfers
    if (validatedData.amount > 10000 && user.kycStatus !== 'APPROVED') {
      return res.status(403).json({
        message: 'KYC verification required for transfers over $10,000',
        code: 'KYC_REQUIRED'
      });
    }

    // Check daily transfer limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyTransfers = await prisma.transaction.aggregate({
      _sum: { amount: true },
      _count: true,
      where: {
        userId: req.user!.id,
        type: 'DEBIT',
        createdAt: { gte: today },
        status: { in: ['PENDING', 'COMPLETED'] }
      }
    });

    const dailyTransferAmount = dailyTransfers._sum.amount || 0;
    const dailyTransferCount = dailyTransfers._count || 0;

    // Daily limits based on user risk level and KYC status
    const getDailyLimits = (riskLevel: string, kycStatus: string) => {
      if (kycStatus === 'APPROVED') {
        switch (riskLevel) {
          case 'LOW': return { amount: 25000, count: 10 };
          case 'MEDIUM': return { amount: 15000, count: 8 };
          case 'HIGH': return { amount: 5000, count: 5 };
          default: return { amount: 10000, count: 5 };
        }
      } else {
        return { amount: 2500, count: 3 }; // Unverified users
      }
    };

    const limits = getDailyLimits(user.riskLevel, user.kycStatus);

    if (dailyTransferAmount + validatedData.amount > limits.amount) {
      return res.status(400).json({
        message: `Daily transfer limit of $${limits.amount.toLocaleString()} exceeded`,
        code: 'DAILY_LIMIT_EXCEEDED',
        currentAmount: dailyTransferAmount,
        limit: limits.amount
      });
    }

    if (dailyTransferCount >= limits.count) {
      return res.status(400).json({
        message: `Daily transfer count limit of ${limits.count} exceeded`,
        code: 'DAILY_COUNT_EXCEEDED',
        currentCount: dailyTransferCount,
        limit: limits.count
      });
    }

    // Check available balance for external transfers
    if (validatedData.transferType === 'external_bank') {
      const pendingExternalTransfers = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: req.user!.id,
          type: 'DEBIT',
          metadata: { path: ['status'], equals: 'pending' }
        }
      });

      const totalPending = pendingExternalTransfers._sum.amount || 0;
      const availableBalance = user.balance - totalPending;

      if (availableBalance < validatedData.amount) {
        return res.status(400).json({
          message: 'Insufficient available balance including pending transfers',
          code: 'INSUFFICIENT_FUNDS',
          availableBalance,
          requestedAmount: validatedData.amount
        });
      }
    } else {
      // For internal transfers, check immediate balance
      if (user.balance < validatedData.amount) {
        return res.status(400).json({
          message: 'Insufficient balance for internal transfer',
          code: 'INSUFFICIENT_FUNDS',
          currentBalance: user.balance,
          requestedAmount: validatedData.amount
        });
      }
    }

    // Bank name validation for external transfers
    if (validatedData.transferType === 'external_bank' && validatedData.bankName) {
      const validBanks = await getValidBanks(); // Could be from database or config
      const isValidBank = validBanks.some(bank => 
        bank.toLowerCase().includes(validatedData.bankName!.toLowerCase()) ||
        validatedData.bankName!.toLowerCase().includes(bank.toLowerCase())
      );

      if (!isValidBank) {
        return res.status(400).json({
          message: 'Bank name not recognized. Please verify the bank name.',
          code: 'INVALID_BANK',
          providedBank: validatedData.bankName
        });
      }
    }

    // Attach validated data to request
    req.validatedTransfer = validatedData;
    next();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid transfer request',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    console.error('Transfer validation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin review validation middleware
export const validateAdminReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate admin permissions
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validate request body
    const validatedData = adminReviewSchema.parse(req.body);
    
    // Check if transfer exists and is pending
    const transfer = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, balance: true }
        }
      }
    });

    if (!transfer) {
      return res.status(404).json({
        message: 'Transfer not found',
        code: 'TRANSFER_NOT_FOUND'
      });
    }

    if (transfer.metadata?.status !== 'pending') {
      return res.status(400).json({
        message: 'Transfer is not pending approval',
        code: 'INVALID_TRANSFER_STATUS',
        currentStatus: transfer.metadata?.status
      });
    }

    // For approvals, verify user still has sufficient balance
    if (validatedData.action === 'approve') {
      if (transfer.user.balance < transfer.amount) {
        return res.status(400).json({
          message: 'User no longer has sufficient balance for this transfer',
          code: 'INSUFFICIENT_USER_BALANCE',
          userBalance: transfer.user.balance,
          transferAmount: transfer.amount
        });
      }
    }

    // Log admin action for audit trail
    await prisma.adminLog.create({
      data: {
        adminId: req.user.id,
        action: `REVIEW_TRANSFER_${validatedData.action.toUpperCase()}`,
        targetUserId: transfer.userId,
        amount: transfer.amount,
        description: `Admin ${req.user.id} initiated ${validatedData.action} for transfer ${transfer.id}`
      }
    });

    // Attach validated data and transfer to request
    req.validatedReview = validatedData;
    req.transferToReview = transfer;
    next();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid review request',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    console.error('Admin review validation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Fraud detection middleware
export const fraudDetection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { amount, transferType, bankName } = req.validatedTransfer!;

    let riskScore = 0;
    const riskFactors: string[] = [];

    // Amount-based risk
    if (amount > 25000) {
      riskScore += 5;
      riskFactors.push('Very high amount');
    } else if (amount > 10000) {
      riskScore += 3;
      riskFactors.push('High amount');
    } else if (amount > 5000) {
      riskScore += 1;
      riskFactors.push('Moderate amount');
    }

    // Check for suspicious patterns in the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentActivity = await prisma.transaction.count({
      where: {
        userId,
        createdAt: { gte: last24Hours },
        type: 'DEBIT'
      }
    });

    if (recentActivity > 10) {
      riskScore += 3;
      riskFactors.push('High transaction frequency');
    }

    // Check for new recipient (external bank transfers)
    if (transferType === 'external_bank' && bankName) {
      const previousTransfers = await prisma.transaction.count({
        where: {
          userId,
          metadata: {
            path: ['bankName'],
            equals: bankName
          }
        }
      });

      if (previousTransfers === 0) {
        riskScore += 2;
        riskFactors.push('New recipient bank');
      }
    }

    // Check user's historical behavior
    const userTransactionHistory = await prisma.transaction.aggregate({
      _avg: { amount: true },
      _max: { amount: true },
      where: {
        userId,
        type: 'DEBIT',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    });

    const avgAmount = userTransactionHistory._avg.amount || 0;
    const maxAmount = userTransactionHistory._max.amount || 0;

    // Unusual amount compared to history
    if (amount > avgAmount * 5) {
      riskScore += 2;
      riskFactors.push('Amount significantly higher than average');
    }

    if (amount > maxAmount * 1.5) {
      riskScore += 1;
      riskFactors.push('Amount exceeds recent maximum');
    }

    // Time-based risk (unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      riskScore += 1;
      riskFactors.push('Transfer at unusual hour');
    }

    // Geographic risk (could be enhanced with IP geolocation)
    // This is a placeholder for IP-based risk assessment
    
    // Determine risk level
    let riskLevel = 'LOW';
    if (riskScore >= 8) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 5) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 3) {
      riskLevel = 'MEDIUM';
    }

    // Auto-block high-risk transfers
    if (riskLevel === 'CRITICAL') {
      await prisma.securityEvent.create({
        data: {
          userId,
          eventType: 'SUSPICIOUS_ACTIVITY',
          description: `High-risk transfer attempt blocked: $${amount} to ${transferType}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          riskLevel: 'CRITICAL',
          metadata: {
            riskScore,
            riskFactors,
            transferAmount: amount,
            transferType,
            bankName
          }
        }
      });

      return res.status(403).json({
        message: 'Transfer blocked due to high risk score. Please contact support.',
        code: 'HIGH_RISK_BLOCKED',
        riskLevel,
        contactSupport: true
      });
    }

    // Attach risk assessment to request
    req.riskAssessment = {
      riskScore,
      riskLevel,
      riskFactors,
      requiresManualReview: riskLevel === 'HIGH' || riskScore >= 4
    };

    next();

  } catch (error) {
    console.error('Fraud detection error:', error);
    // Don't block transfer on fraud detection errors, but log them
    req.riskAssessment = {
      riskScore: 1,
      riskLevel: 'MEDIUM',
      riskFactors: ['Fraud detection system error'],
      requiresManualReview: false
    };
    next();
  }
};

// Helper function to get valid banks (could be from database)
async function getValidBanks(): Promise<string[]> {
  // In production, this could come from a database table or external service
  return [
    // US Banks
    "Chase Bank", "Bank of America", "Wells Fargo", "Citibank", "U.S. Bank",
    "PNC Bank", "Goldman Sachs Bank", "Capital One", "TD Bank", "Truist Bank",
    // Add more banks as needed
  ];
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      validatedTransfer?: z.infer<typeof transferRequestSchema>;
      validatedReview?: z.infer<typeof adminReviewSchema>;
      transferToReview?: any;
      riskAssessment?: {
        riskScore: number;
        riskLevel: string;
        riskFactors: string[];
        requiresManualReview: boolean;
      };
    }
  }
}