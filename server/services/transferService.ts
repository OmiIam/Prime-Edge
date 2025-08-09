import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { 
  sanitizeTransactionData, 
  sanitizeTransferForAdmin, 
  sanitizeUserForAdmin 
} from '../utils/sanitizeTransactionData';
import { 
  validateAmount, 
  validateBankCode, 
  validateAccountNumber, 
  validateRecipientName 
} from '../utils/responseHelpers';

const prisma = new PrismaClient();

export interface CreateTransferRequest {
  amount: number;
  currency?: string;
  recipient: {
    name: string;
    accountNumber: string;
    bankCode: string;
  };
  metadata?: Record<string, any>;
}

export interface BankApiResponse {
  success: boolean;
  reference?: string;
  message?: string;
  error?: string;
}

/**
 * Mock bank API client - replace with real implementation in production
 */
class MockBankApiClient {
  async transfer(payload: {
    amount: number;
    currency: string;
    recipient: {
      name: string;
      accountNumber: string;
      bankCode: string;
    };
    reference: string;
  }): Promise<BankApiResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success/failure based on amount (for testing)
    const shouldSucceed = payload.amount <= 1000000; // Fail if over 1M for testing
    
    if (shouldSucceed) {
      return {
        success: true,
        reference: `BNK${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        message: 'Transfer completed successfully',
      };
    } else {
      return {
        success: false,
        error: 'Insufficient funds in source account or bank API error',
      };
    }
  }

  async verifyAccount(accountNumber: string, bankCode: string): Promise<{
    isValid: boolean;
    accountName?: string;
    error?: string;
  }> {
    // Simulate account verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock verification - in production, call real bank API
    const mockNames = ['John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    
    return {
      isValid: true,
      accountName: randomName,
    };
  }
}

const bankApiClient = new MockBankApiClient();

export class TransferService {
  /**
   * Creates a pending external transfer
   */
  async createPendingTransfer(userId: string, request: CreateTransferRequest) {
    // Validate input
    const amountValidation = validateAmount(request.amount);
    if (!amountValidation.isValid) {
      throw new Error(amountValidation.error);
    }

    const bankCodeValidation = validateBankCode(request.recipient.bankCode);
    if (!bankCodeValidation.isValid) {
      throw new Error(bankCodeValidation.error);
    }

    const accountNumberValidation = validateAccountNumber(request.recipient.accountNumber);
    if (!accountNumberValidation.isValid) {
      throw new Error(accountNumberValidation.error);
    }

    const nameValidation = validateRecipientName(request.recipient.name);
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }

    // Verify user exists and has sufficient balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, balance: true, email: true, name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const transferAmount = new Decimal(amountValidation.value!);
    if (new Decimal(user.balance).lt(transferAmount)) {
      throw new Error('Insufficient balance');
    }

    // Optional: Verify recipient account with bank API
    try {
      const accountVerification = await bankApiClient.verifyAccount(
        request.recipient.accountNumber,
        request.recipient.bankCode
      );
      
      if (!accountVerification.isValid) {
        throw new Error('Invalid recipient account details');
      }
    } catch (verificationError) {
      console.warn('Account verification failed:', verificationError);
      // Continue without verification for now - could be made strict in production
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'EXTERNAL_TRANSFER',
        amount: transferAmount,
        currency: request.currency || 'NGN',
        description: `External transfer to ${request.recipient.name}`,
        status: 'PENDING',
        metadata: {
          recipient: request.recipient,
          submittedAt: new Date().toISOString(),
          submittedBy: userId,
          requiresApproval: true,
          ...(request.metadata || {}),
        },
      },
    });

    const sanitizedTransaction = sanitizeTransactionData(transaction);

    // Emit socket event for real-time update
    try {
      const { getSocketService } = await import('../socket/socket');
      const socketService = getSocketService();
      socketService.emitTransferPending(userId, sanitizedTransaction);
    } catch (socketError) {
      console.warn('Socket service not available for transfer creation:', socketError);
    }

    return sanitizedTransaction;
  }

  /**
   * Gets transfer updates for a user (polling fallback)
   */
  async getTransferUpdates(userId: string, options: {
    limit?: number;
    since?: Date;
  } = {}) {
    const limit = Math.min(options.limit || 50, 100);
    
    const whereClause: any = {
      userId,
      type: 'EXTERNAL_TRANSFER',
    };

    if (options.since) {
      whereClause.updatedAt = {
        gte: options.since,
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const count = await prisma.transaction.count({
      where: whereClause,
    });

    return {
      updates: transactions.map(t => sanitizeTransactionData(t)),
      count,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Gets pending transfers for admin review
   */
  async getPendingTransfers(options: {
    page?: number;
    limit?: number;
  } = {}) {
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(options.limit || 50, 100);
    const skip = (page - 1) * limit;

    const [transfers, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          type: 'EXTERNAL_TRANSFER',
          status: 'PENDING',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              accountNumber: true,
              kycStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Oldest first for FIFO processing
        skip,
        take: limit,
      }),
      prisma.transaction.count({
        where: {
          type: 'EXTERNAL_TRANSFER',
          status: 'PENDING',
        },
      }),
    ]);

    const sanitizedTransfers = transfers.map(transfer => 
      sanitizeTransferForAdmin(transfer, transfer.user)
    );

    return {
      transfers: sanitizedTransfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approves a pending transfer
   */
  async approveTransfer(transferId: string, adminId: string, reference?: string) {
    const transfer = await prisma.transaction.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: { id: true, balance: true, email: true, name: true },
        },
      },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer is not in pending status');
    }

    // Update to processing status
    let updatedTransfer = await prisma.transaction.update({
      where: { id: transferId },
      data: {
        status: 'PROCESSING',
        metadata: {
          ...((transfer.metadata as any) || {}),
          processingStartedAt: new Date().toISOString(),
          approvedBy: adminId,
          approvedAt: new Date().toISOString(),
          adminReference: reference,
        },
      },
    });

    try {
      // Call bank API to execute transfer
      const bankResponse = await bankApiClient.transfer({
        amount: transfer.amount.toNumber(),
        currency: transfer.currency,
        recipient: (transfer.metadata as any)?.recipient,
        reference: transfer.id,
      });

      if (bankResponse.success) {
        // Success - mark as completed and deduct balance
        await prisma.$transaction(async (tx) => {
          // Update transfer status
          updatedTransfer = await tx.transaction.update({
            where: { id: transferId },
            data: {
              status: 'COMPLETED',
              reference: bankResponse.reference,
              metadata: {
                ...((transfer.metadata as any) || {}),
                processingStartedAt: new Date().toISOString(),
                approvedBy: adminId,
                approvedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                adminReference: reference,
                bankReference: bankResponse.reference,
                bankMessage: bankResponse.message,
              },
            },
          });

          // Deduct from user balance
          await tx.user.update({
            where: { id: transfer.userId },
            data: {
              balance: {
                decrement: transfer.amount.toNumber(),
              },
            },
          });
        });
      } else {
        // Bank API failed - mark as failed
        updatedTransfer = await prisma.transaction.update({
          where: { id: transferId },
          data: {
            status: 'FAILED',
            metadata: {
              ...((transfer.metadata as any) || {}),
              processingStartedAt: new Date().toISOString(),
              approvedBy: adminId,
              approvedAt: new Date().toISOString(),
              failedAt: new Date().toISOString(),
              adminReference: reference,
              bankError: bankResponse.error,
            },
          },
        });
      }
    } catch (bankError) {
      console.error('Bank API error:', bankError);
      
      // Mark as failed due to bank API error
      updatedTransfer = await prisma.transaction.update({
        where: { id: transferId },
        data: {
          status: 'FAILED',
          metadata: {
            ...((transfer.metadata as any) || {}),
            processingStartedAt: new Date().toISOString(),
            approvedBy: adminId,
            approvedAt: new Date().toISOString(),
            failedAt: new Date().toISOString(),
            adminReference: reference,
            systemError: bankError instanceof Error ? bankError.message : 'Unknown bank API error',
          },
        },
      });
    }

    return sanitizeTransactionData(updatedTransfer);
  }

  /**
   * Rejects a pending transfer
   */
  async rejectTransfer(transferId: string, adminId: string, reason: string) {
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    const transfer = await prisma.transaction.findUnique({
      where: { id: transferId },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer is not in pending status');
    }

    const updatedTransfer = await prisma.transaction.update({
      where: { id: transferId },
      data: {
        status: 'REJECTED',
        metadata: {
          ...((transfer.metadata as any) || {}),
          rejectedBy: adminId,
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason.trim(),
        },
      },
    });

    return sanitizeTransactionData(updatedTransfer);
  }

  /**
   * Gets transfer statistics for admin dashboard
   */
  async getTransferStats() {
    const [
      totalPending,
      totalProcessing,
      totalCompleted,
      totalRejected,
      totalVolume,
    ] = await Promise.all([
      prisma.transaction.count({
        where: { type: 'EXTERNAL_TRANSFER', status: 'PENDING' },
      }),
      prisma.transaction.count({
        where: { type: 'EXTERNAL_TRANSFER', status: 'PROCESSING' },
      }),
      prisma.transaction.count({
        where: { type: 'EXTERNAL_TRANSFER', status: 'COMPLETED' },
      }),
      prisma.transaction.count({
        where: { type: 'EXTERNAL_TRANSFER', status: 'REJECTED' },
      }),
      prisma.transaction.aggregate({
        where: { 
          type: 'EXTERNAL_TRANSFER', 
          status: { in: ['COMPLETED', 'PROCESSING'] } 
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      counts: {
        pending: totalPending,
        processing: totalProcessing,
        completed: totalCompleted,
        rejected: totalRejected,
        total: totalPending + totalProcessing + totalCompleted + totalRejected,
      },
      totalVolume: totalVolume._sum.amount?.toNumber() || 0,
    };
  }
}

export const transferService = new TransferService();