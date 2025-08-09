import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TransferService, CreateTransferRequest } from '../services/transferService';
import { PrismaClient } from '@prisma/client';
import { transferController, adminTransferController } from '../controllers/transferController';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    $transaction: jest.fn(),
  },
} as any;

// Mock socket service
jest.mock('../socket/socket', () => ({
  getSocketService: jest.fn().mockReturnValue({
    emitTransferPending: jest.fn(),
    emitTransferUpdate: jest.fn(),
  }),
}));

describe('TransferService', () => {
  let transferService: TransferService;
  let mockRequest: CreateTransferRequest;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    transferService = new TransferService();
    
    mockRequest = {
      amount: 1000,
      currency: 'NGN',
      recipient: {
        name: 'John Doe',
        accountNumber: '1234567890',
        bankCode: '044',
      },
      metadata: { note: 'Test transfer' },
    };

    // Setup default mock responses
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      balance: 5000,
      email: 'user@example.com',
      name: 'Test User',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createPendingTransfer', () => {
    it('should create a pending transfer successfully', async () => {
      const mockTransaction = {
        id: 'tx-1',
        userId: 'user-1',
        type: 'EXTERNAL_TRANSFER',
        amount: { toNumber: () => 1000 },
        currency: 'NGN',
        status: 'PENDING',
        description: 'External transfer to John Doe',
        metadata: {
          recipient: mockRequest.recipient,
          submittedAt: expect.any(String),
          submittedBy: 'user-1',
          requiresApproval: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.transaction.create.mockResolvedValue(mockTransaction);

      const result = await transferService.createPendingTransfer('user-1', mockRequest);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, balance: true, email: true, name: true },
      });

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'EXTERNAL_TRANSFER',
          status: 'PENDING',
          description: 'External transfer to John Doe',
        }),
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'tx-1',
        userId: 'user-1',
        type: 'EXTERNAL_TRANSFER',
        amount: 1000,
        status: 'PENDING',
      }));
    });

    it('should throw error for invalid amount', async () => {
      const invalidRequest = { ...mockRequest, amount: -100 };

      await expect(
        transferService.createPendingTransfer('user-1', invalidRequest)
      ).rejects.toThrow('Amount must be greater than 0');
    });

    it('should throw error for insufficient balance', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        balance: 500, // Less than requested amount
        email: 'user@example.com',
        name: 'Test User',
      });

      await expect(
        transferService.createPendingTransfer('user-1', mockRequest)
      ).rejects.toThrow('Insufficient balance');
    });

    it('should throw error for invalid bank code', async () => {
      const invalidRequest = { ...mockRequest };
      invalidRequest.recipient.bankCode = '12'; // Too short

      await expect(
        transferService.createPendingTransfer('user-1', invalidRequest)
      ).rejects.toThrow('Invalid bank code format (must be 3 digits)');
    });

    it('should throw error for invalid account number', async () => {
      const invalidRequest = { ...mockRequest };
      invalidRequest.recipient.accountNumber = '123456789'; // Too short

      await expect(
        transferService.createPendingTransfer('user-1', invalidRequest)
      ).rejects.toThrow('Invalid account number format (must be 10 digits)');
    });
  });

  describe('getTransferUpdates', () => {
    it('should return transfer updates for user', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          userId: 'user-1',
          type: 'EXTERNAL_TRANSFER',
          amount: { toNumber: () => 1000 },
          status: 'COMPLETED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.transaction.count.mockResolvedValue(1);

      const result = await transferService.getTransferUpdates('user-1', { limit: 50 });

      expect(result.updates).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('approveTransfer', () => {
    it('should approve and complete transfer successfully', async () => {
      const mockTransfer = {
        id: 'tx-1',
        userId: 'user-1',
        status: 'PENDING',
        amount: { toNumber: () => 1000 },
        currency: 'NGN',
        metadata: { recipient: mockRequest.recipient },
        user: { id: 'user-1', balance: 5000, email: 'user@example.com', name: 'Test User' },
      };

      const mockUpdatedTransfer = {
        ...mockTransfer,
        status: 'COMPLETED',
        reference: 'BNK123456',
        metadata: {
          ...mockTransfer.metadata,
          approvedBy: 'admin-1',
          completedAt: expect.any(String),
          bankReference: 'BNK123456',
        },
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransfer);
      mockPrisma.transaction.update.mockResolvedValue(mockUpdatedTransfer);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          transaction: { update: mockPrisma.transaction.update },
          user: { update: mockPrisma.user.update },
        });
      });

      const result = await transferService.approveTransfer('tx-1', 'admin-1', 'Admin approved');

      expect(result.status).toBe('COMPLETED');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { balance: { decrement: 1000 } },
      });
    });

    it('should throw error for non-existent transfer', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      await expect(
        transferService.approveTransfer('tx-nonexistent', 'admin-1')
      ).rejects.toThrow('Transfer not found');
    });

    it('should throw error for non-pending transfer', async () => {
      const mockTransfer = {
        id: 'tx-1',
        status: 'COMPLETED', // Already completed
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransfer);

      await expect(
        transferService.approveTransfer('tx-1', 'admin-1')
      ).rejects.toThrow('Transfer is not in pending status');
    });
  });

  describe('rejectTransfer', () => {
    it('should reject transfer successfully', async () => {
      const mockTransfer = {
        id: 'tx-1',
        status: 'PENDING',
        metadata: {},
      };

      const mockUpdatedTransfer = {
        ...mockTransfer,
        status: 'REJECTED',
        metadata: {
          rejectedBy: 'admin-1',
          rejectedAt: expect.any(String),
          rejectionReason: 'Invalid recipient details',
        },
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransfer);
      mockPrisma.transaction.update.mockResolvedValue(mockUpdatedTransfer);

      const result = await transferService.rejectTransfer('tx-1', 'admin-1', 'Invalid recipient details');

      expect(result.status).toBe('REJECTED');
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
        data: {
          status: 'REJECTED',
          metadata: expect.objectContaining({
            rejectedBy: 'admin-1',
            rejectionReason: 'Invalid recipient details',
          }),
        },
      });
    });

    it('should throw error for empty rejection reason', async () => {
      await expect(
        transferService.rejectTransfer('tx-1', 'admin-1', '')
      ).rejects.toThrow('Rejection reason is required');
    });
  });
});

describe('Transfer Controllers', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      user: { id: 'user-1', email: 'user@example.com', role: 'USER' },
      body: {},
      query: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      statusCode: 201,
    };
  });

  describe('TransferController.createTransfer', () => {
    it('should create transfer and return 201', async () => {
      mockRequest.body = {
        amount: '1000',
        currency: 'NGN',
        recipient: {
          name: 'John Doe',
          accountNumber: '1234567890',
          bankCode: '044',
        },
      };

      // Mock the service method
      const mockTransaction = {
        id: 'tx-1',
        userId: 'user-1',
        type: 'EXTERNAL_TRANSFER',
        amount: 1000,
        status: 'PENDING',
      };

      jest.spyOn(transferService, 'createPendingTransfer').mockResolvedValue(mockTransaction as any);

      await transferController.createTransfer(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('submitted for approval'),
          data: expect.objectContaining({ transaction: mockTransaction }),
        })
      );
    });

    it('should return 400 for missing recipient info', async () => {
      mockRequest.body = { amount: '1000' }; // Missing recipient

      await transferController.createTransfer(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Amount and recipient information are required',
        })
      );
    });
  });
});