import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../index';
import { getSocketService } from '../socket/socket';
import { sanitizeTransaction, sanitizeTransactions, sanitizeTransactionWithUser } from '../utils/sanitizeTransactionData';
import { validateAmount, validateCurrency, validateRecipientInfo, validatePagination, validateSinceDate } from '../utils/responseHelpers';

/**
 * Transfer Service
 * Handles business logic for external bank transfers with in-process queue simulation
 * 
 * PRODUCTION NOTE: Replace in-process queue with BullMQ/Redis:
 * - npm install bullmq ioredis
 * - Create Queue('transfer-processing', { connection: redisConfig })
 * - Move bank API calls to background workers
 */

export interface CreateTransferData {
  amount: number;
  currency?: string;
  recipientInfo: {
    name: string;
    accountNumber: string;
    bankCode: string;
  };
  description?: string;
}

export interface BankTransferResult {
  success: boolean;
  reference?: string;
  message?: string;
  error?: string;
}

/**
 * Mock Bank API Client - Replace with real bank integration
 */
class MockBankApiClient {
  private delay: number;

  constructor() {
    this.delay = parseInt(process.env.MOCK_BANK_DELAY_MS || '2000');
  }

  async submitTransfer(transferData: {
    amount: number;
    currency: string;
    recipientInfo: any;
    reference: string;
  }): Promise<BankTransferResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, this.delay));
    
    console.log(`[BankAPI] Processing transfer: ${transferData.reference} for ${transferData.amount} ${transferData.currency}`);
    
    // Simulate success/failure based on amount (for testing)
    const shouldFail = transferData.amount > 50000; // Fail transfers over 50k
    
    if (shouldFail) {
      return {
        success: false,
        error: 'Insufficient funds or bank processing error'
      };
    }

    return {
      success: true,
      reference: `BANK${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      message: 'Transfer processed successfully'
    };
  }

  async verifyRecipient(recipientInfo: any): Promise<{ isValid: boolean; accountName?: string; error?: string }> {
    // Simulate recipient verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockNames = ['John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams', 'David Brown'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    
    return {
      isValid: true,
      accountName: randomName
    };
  }
}

/**
 * In-process job queue simulation
 * PRODUCTION: Replace with BullMQ
 */
class InProcessQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  async add(jobFunction: () => Promise<void>) {
    this.queue.push(jobFunction);
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        try {
          await job();
        } catch (error) {
          console.error('[Queue] Job failed:', error);
        }
      }
    }
    
    this.processing = false;
  }
}

// Initialize services
const bankClient = new MockBankApiClient();
const processQueue = new InProcessQueue();

export class TransferService {
  /**
   * Create a new external transfer
   */
  async createTransfer(userId: string, transferData: CreateTransferData) {
    console.log(`[Transfer] Creating transfer for user ${userId}:`, transferData);

    // Validate input
    const amountValidation = validateAmount(transferData.amount);
    if (!amountValidation.isValid) {
      throw new Error(amountValidation.error!);
    }

    const currencyValidation = validateCurrency(transferData.currency);
    if (!currencyValidation.isValid) {
      throw new Error(currencyValidation.error!);
    }

    const recipientValidation = validateRecipientInfo(transferData.recipientInfo);
    if (!recipientValidation.isValid) {
      throw new Error(recipientValidation.error!);
    }

    // Check user exists and has sufficient balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        balance: true, 
        isActive: true 
      }
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    const transferAmount = new Decimal(amountValidation.value!);
    if (new Decimal(user.balance).lt(transferAmount)) {
      throw new Error('Insufficient balance');
    }

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'EXTERNAL_TRANSFER',
        amount: transferAmount,
        currency: currencyValidation.value!,
        status: 'PENDING',
        description: transferData.description || `Transfer to ${transferData.recipientInfo.name}`,
        metadata: {
          recipientInfo: transferData.recipientInfo,
          submittedAt: new Date().toISOString(),
          requiresApproval: true,
          verifiedRecipient: false
        }
      }
    });

    const sanitizedTransaction = sanitizeTransaction(transaction);
    
    if (sanitizedTransaction) {
      // Emit real-time notification
      try {
        const socketService = getSocketService();
        socketService.emitTransferPending(userId, sanitizedTransaction);
      } catch (socketError) {
        console.warn('[Transfer] Socket service unavailable:', socketError);
      }

      // Enqueue background recipient verification (optional)
      processQueue.add(async () => {
        try {
          const verification = await bankClient.verifyRecipient(transferData.recipientInfo);
          
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              metadata: {
                ...transaction.metadata as any,
                recipientVerification: verification,
                verifiedAt: new Date().toISOString()
              }
            }
          });

          console.log(`[Transfer] Recipient verification completed for ${transaction.id}:`, verification);
        } catch (error) {
          console.error(`[Transfer] Recipient verification failed for ${transaction.id}:`, error);
        }
      });
    }

    return sanitizedTransaction;
  }

  /**
   * Get transfer updates for a user (polling fallback)
   */
  async getUserTransferUpdates(userId: string, options: { limit?: number; since?: string } = {}) {
    console.log(`[Transfer] Getting updates for user ${userId}:`, options);

    const { limit } = validatePagination(undefined, options.limit);
    const sinceValidation = validateSinceDate(options.since);
    
    if (!sinceValidation.isValid) {
      throw new Error(sinceValidation.error!);
    }

    const whereClause: any = {
      userId,
      type: 'EXTERNAL_TRANSFER'
    };

    if (sinceValidation.value) {
      whereClause.updatedAt = {
        gte: sinceValidation.value
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      take: limit
    });

    const sanitizedTransactions = sanitizeTransactions(transactions);
    
    return {
      transfers: sanitizedTransactions,
      count: sanitizedTransactions.length
    };
  }

  /**
   * Get pending transfers for admin review
   */
  async getPendingTransfers(options: { page?: number; limit?: number } = {}) {
    console.log('[Transfer] Getting pending transfers for admin:', options);

    const { page, limit } = validatePagination(options.page, options.limit);
    const skip = (page - 1) * limit;

    const [transfers, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          type: 'EXTERNAL_TRANSFER',
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }, // FIFO processing
        skip,
        take: limit
      }),
      prisma.transaction.count({
        where: {
          type: 'EXTERNAL_TRANSFER',
          status: 'PENDING'
        }
      })
    ]);

    const sanitizedTransfers = transfers.map(sanitizeTransactionWithUser).filter(Boolean);

    return {
      transfers: sanitizedTransfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Approve a pending transfer (admin action)
   */
  async approveTransfer(transferId: string, adminId: string, adminNotes?: string) {
    console.log(`[Transfer] Admin ${adminId} approving transfer ${transferId}`);

    const transfer = await prisma.transaction.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: { id: true, email: true, name: true, balance: true }
        }
      }
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer is not in pending status');
    }

    if (transfer.type !== 'EXTERNAL_TRANSFER') {
      throw new Error('Invalid transfer type');
    }

    // Update to processing status
    const processingTransaction = await prisma.transaction.update({
      where: { id: transferId },
      data: {
        status: 'PROCESSING',
        metadata: {
          ...transfer.metadata as any,
          approvedBy: adminId,
          approvedAt: new Date().toISOString(),
          adminNotes: adminNotes || null,
          processingStartedAt: new Date().toISOString()
        }
      }
    });

    // Enqueue bank transfer processing
    processQueue.add(async () => {
      try {
        console.log(`[Transfer] Processing bank transfer for ${transferId}`);
        
        const bankResult = await bankClient.submitTransfer({
          amount: transfer.amount.toNumber(),
          currency: transfer.currency,
          recipientInfo: (transfer.metadata as any)?.recipientInfo,
          reference: transferId
        });

        if (bankResult.success) {
          // Success - complete transfer and deduct balance
          await prisma.$transaction(async (tx) => {
            // Update transaction
            await tx.transaction.update({
              where: { id: transferId },
              data: {
                status: 'COMPLETED',
                reference: bankResult.reference,
                metadata: {
                  ...processingTransaction.metadata as any,
                  completedAt: new Date().toISOString(),
                  bankReference: bankResult.reference,
                  bankMessage: bankResult.message
                }
              }
            });

            // Deduct balance
            await tx.user.update({
              where: { id: transfer.userId },
              data: {
                balance: {
                  decrement: transfer.amount.toNumber()
                }
              }
            });
          });

          console.log(`[Transfer] Transfer ${transferId} completed successfully`);
        } else {
          // Failed - mark as failed
          await prisma.transaction.update({
            where: { id: transferId },
            data: {
              status: 'FAILED',
              metadata: {
                ...processingTransaction.metadata as any,
                failedAt: new Date().toISOString(),
                bankError: bankResult.error
              }
            }
          });

          console.log(`[Transfer] Transfer ${transferId} failed:`, bankResult.error);
        }

        // Get updated transaction and emit socket event
        const updatedTransaction = await prisma.transaction.findUnique({
          where: { id: transferId }
        });

        if (updatedTransaction) {
          const sanitized = sanitizeTransaction(updatedTransaction);
          if (sanitized) {
            try {
              const socketService = getSocketService();
              socketService.emitTransferUpdate(transfer.userId, sanitized);
            } catch (socketError) {
              console.warn('[Transfer] Socket service unavailable:', socketError);
            }
          }
        }

      } catch (error) {
        console.error(`[Transfer] Bank processing error for ${transferId}:`, error);
        
        // Mark as failed due to system error
        await prisma.transaction.update({
          where: { id: transferId },
          data: {
            status: 'FAILED',
            metadata: {
              ...processingTransaction.metadata as any,
              failedAt: new Date().toISOString(),
              systemError: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        });
      }
    });

    return sanitizeTransaction(processingTransaction);
  }

  /**
   * Reject a pending transfer (admin action)
   */
  async rejectTransfer(transferId: string, adminId: string, rejectionReason: string) {
    console.log(`[Transfer] Admin ${adminId} rejecting transfer ${transferId}`);

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    const transfer = await prisma.transaction.findUnique({
      where: { id: transferId }
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer is not in pending status');
    }

    // Update to rejected status
    const rejectedTransaction = await prisma.transaction.update({
      where: { id: transferId },
      data: {
        status: 'REJECTED',
        metadata: {
          ...transfer.metadata as any,
          rejectedBy: adminId,
          rejectedAt: new Date().toISOString(),
          rejectionReason: rejectionReason.trim()
        }
      }
    });

    const sanitized = sanitizeTransaction(rejectedTransaction);
    
    // Emit real-time notification
    if (sanitized) {
      try {
        const socketService = getSocketService();
        socketService.emitTransferUpdate(transfer.userId, sanitized);
      } catch (socketError) {
        console.warn('[Transfer] Socket service unavailable:', socketError);
      }
    }

    return sanitized;
  }

  /**
   * Get transfer statistics for admin dashboard
   */
  async getTransferStats() {
    console.log('[Transfer] Getting transfer statistics');

    const [
      pendingCount,
      processingCount,
      completedCount,
      rejectedCount,
      failedCount,
      totalVolume
    ] = await Promise.all([
      prisma.transaction.count({
        where: { type: 'EXTERNAL_TRANSFER', status: 'PENDING' }
      }),
      prisma.transaction.count({
        where: { type: 'EXTERNAL_TRANSFER', status: 'PROCESSING' }
      }),
      prisma.transaction.count({
        where: { type: 'EXTERNAL_TRANSFER', status: 'COMPLETED' }
      }),
      prisma.transaction.count({
        where: { type: 'EXTERNAL_TRANSFER', status: 'REJECTED' }
      }),
      prisma.transaction.count({
        where: { type: 'EXTERNAL_TRANSFER', status: 'FAILED' }
      }),
      prisma.transaction.aggregate({
        where: { 
          type: 'EXTERNAL_TRANSFER', 
          status: 'COMPLETED' 
        },
        _sum: { amount: true }
      })
    ]);

    return {
      counts: {
        pending: pendingCount,
        processing: processingCount,
        completed: completedCount,
        rejected: rejectedCount,
        failed: failedCount,
        total: pendingCount + processingCount + completedCount + rejectedCount + failedCount
      },
      totalVolume: totalVolume._sum.amount?.toNumber() || 0
    };
  }
}

export const transferService = new TransferService();