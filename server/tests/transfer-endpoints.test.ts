import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import express, { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  testPrisma, 
  TEST_USERS, 
  TEST_TOKENS,
  setupTestEnvironment,
  restoreEnvironment,
  createTestTransfer,
  waitFor
} from './setup';

import { authenticateToken, requireAdmin } from '../middleware/auth';
import { transferRateLimit } from '../middleware/rateLimiting';
import { UserTransferController, AdminTransferController } from '../controllers/transferController';
import { initializeSocket } from '../socket/socket';

/**
 * Comprehensive HTTP Endpoint Tests
 * Tests all transfer-related API endpoints with real database integration
 */

describe('Transfer HTTP Endpoints Integration Tests', () => {
  let app: Express;
  let httpServer: any;
  let socketServer: SocketIOServer;

  beforeAll(async () => {
    console.log('🧪 Setting up test environment...');
    
    // Setup test environment variables
    setupTestEnvironment();
    
    // Setup test database
    await setupTestDatabase();
    
    // Create Express app for testing
    app = express();
    httpServer = createServer(app);
    
    // Initialize Socket.IO for testing
    socketServer = initializeSocket(httpServer);
    
    // Configure Express middleware
    app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    // Initialize controllers
    const userTransferController = new UserTransferController();
    const adminTransferController = new AdminTransferController();
    
    // Setup routes exactly as in production
    const userRouter = express.Router();
    const adminRouter = express.Router();
    
    // User routes
    userRouter.post('/transfer', transferRateLimit, authenticateToken, userTransferController.createTransfer);
    userRouter.get('/transfer-updates', authenticateToken, userTransferController.getTransferUpdates);
    
    // Admin routes  
    adminRouter.get('/pending-transfers', authenticateToken, requireAdmin, adminTransferController.getPendingTransfers);
    adminRouter.post('/transfer/:id/approve', authenticateToken, requireAdmin, adminTransferController.approveTransfer);
    adminRouter.post('/transfer/:id/reject', authenticateToken, requireAdmin, adminTransferController.rejectTransfer);
    adminRouter.get('/transfer-stats', authenticateToken, requireAdmin, adminTransferController.getTransferStats);
    
    app.use('/api/user', userRouter);
    app.use('/api/admin', adminRouter);
    
    // Global error handler
    app.use((error: any, req: any, res: any, next: any) => {
      console.error('Test app error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
      });
    });
    
    console.log('✅ Test environment ready');
  });

  beforeEach(async () => {
    // Clear any existing transfers before each test
    await testPrisma.transaction.deleteMany({
      where: {
        type: 'EXTERNAL_TRANSFER'
      }
    });
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test environment...');
    
    // Close socket server
    if (socketServer) {
      socketServer.close();
    }
    
    // Close HTTP server
    if (httpServer) {
      httpServer.close();
    }
    
    // Cleanup database
    await cleanupTestDatabase();
    
    // Restore environment
    restoreEnvironment();
    
    console.log('✅ Test cleanup complete');
  });

  describe('POST /api/user/transfer', () => {
    const validTransferData = {
      amount: 500.00,
      currency: 'USD',
      recipientInfo: {
        name: 'John Doe',
        accountNumber: '1234567890',
        bankCode: 'ABC123'
      },
      description: 'Test transfer payment'
    };

    it('should create transfer successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send(validTransferData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('submitted successfully'),
        data: {
          transaction: expect.objectContaining({
            id: expect.any(String),
            userId: TEST_USERS.regularUser.id,
            type: 'EXTERNAL_TRANSFER',
            amount: 500,
            currency: 'USD',
            status: 'PENDING',
            description: 'Test transfer payment'
          })
        }
      });

      // Verify database record
      const dbTransaction = await testPrisma.transaction.findFirst({
        where: {
          id: response.body.data.transaction.id
        }
      });

      expect(dbTransaction).toBeTruthy();
      expect(dbTransaction?.status).toBe('PENDING');
      expect(dbTransaction?.metadata).toHaveProperty('requiresApproval', true);
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .post('/api/user/transfer')
        .send(validTransferData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Access token required')
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', 'Bearer invalid-token')
        .send(validTransferData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for inactive user', async () => {
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.inactiveUser}`)
        .send(validTransferData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('User not found or inactive')
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        amount: 500,
        // Missing currency and recipientInfo
      };

      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should reject negative amounts', async () => {
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send({
          ...validTransferData,
          amount: -100
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Amount must be greater than 0');
    });

    it('should reject insufficient balance transfers', async () => {
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send({
          ...validTransferData,
          amount: 999999.99 // More than test user balance
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient balance');
    });

    it('should validate recipient info format', async () => {
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send({
          ...validTransferData,
          recipientInfo: {
            name: 'A', // Too short
            accountNumber: '123', // Too short
            bankCode: 'X' // Too short
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/name.*least 2 characters|account.*least 5 characters|bank.*least 2 characters/);
    });

    it('should sanitize response data', async () => {
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send(validTransferData)
        .expect(201);

      // Check that circular references are removed
      const transaction = response.body.data.transaction;
      expect(transaction).not.toHaveProperty('user');
      expect(transaction).not.toHaveProperty('__proto__');
      expect(typeof transaction.amount).toBe('number');
    });
  });

  describe('GET /api/user/transfer-updates', () => {
    beforeEach(async () => {
      // Create some test transfers
      await createTestTransfer(TEST_USERS.regularUser.id, {
        status: 'COMPLETED',
        amount: 100
      });
      await createTestTransfer(TEST_USERS.regularUser.id, {
        status: 'PENDING',
        amount: 200
      });
      await createTestTransfer(TEST_USERS.adminUser.id, {
        status: 'COMPLETED',
        amount: 300
      });
    });

    it('should return user transfer updates', async () => {
      const response = await request(app)
        .get('/api/user/transfer-updates')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          transfers: expect.arrayContaining([
            expect.objectContaining({
              userId: TEST_USERS.regularUser.id,
              type: 'EXTERNAL_TRANSFER',
              amount: expect.any(Number)
            })
          ]),
          count: expect.any(Number)
        }
      });

      // Should only return transfers for the authenticated user
      expect(response.body.data.transfers).toHaveLength(2);
      expect(response.body.data.transfers.every((t: any) => t.userId === TEST_USERS.regularUser.id)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/user/transfer-updates?limit=1')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(200);

      expect(response.body.data.transfers).toHaveLength(1);
    });

    it('should respect since parameter', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();

      const response = await request(app)
        .get(`/api/user/transfer-updates?since=${futureDate}`)
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(200);

      expect(response.body.data.transfers).toHaveLength(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/user/transfer-updates')
        .expect(401);
    });
  });

  describe('GET /api/admin/pending-transfers', () => {
    beforeEach(async () => {
      // Create test transfers with different statuses
      await createTestTransfer(TEST_USERS.regularUser.id, { status: 'PENDING' });
      await createTestTransfer(TEST_USERS.regularUser.id, { status: 'COMPLETED' });
      await createTestTransfer(TEST_USERS.adminUser.id, { status: 'PENDING' });
    });

    it('should return pending transfers for admin', async () => {
      const response = await request(app)
        .get('/api/admin/pending-transfers')
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          transfers: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 20,
            total: expect.any(Number)
          })
        }
      });

      // Should only return pending transfers
      const pendingTransfers = response.body.data.transfers;
      expect(pendingTransfers.every((t: any) => t.status === 'PENDING')).toBe(true);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/pending-transfers')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(403);

      expect(response.body.message).toContain('Admin access required');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/admin/pending-transfers?page=1&limit=1')
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .expect(200);

      expect(response.body.data.transfers).toHaveLength(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('POST /api/admin/transfer/:id/approve', () => {
    let testTransferId: string;

    beforeEach(async () => {
      const transfer = await createTestTransfer(TEST_USERS.regularUser.id, {
        status: 'PENDING',
        amount: 1000
      });
      testTransferId = transfer.id;
    });

    it('should approve pending transfer successfully', async () => {
      const response = await request(app)
        .post(`/api/admin/transfer/${testTransferId}/approve`)
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .send({
          adminNotes: 'Approved after verification'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('approved'),
        data: {
          transaction: expect.objectContaining({
            id: testTransferId,
            status: 'PROCESSING'
          })
        }
      });

      // Verify database update
      const dbTransaction = await testPrisma.transaction.findUnique({
        where: { id: testTransferId }
      });

      expect(dbTransaction?.status).toBe('PROCESSING');
      expect(dbTransaction?.metadata).toMatchObject({
        requiresApproval: true,
        adminNotes: 'Approved after verification',
        approvedBy: TEST_USERS.adminUser.id,
        approvedAt: expect.any(String)
      });
    });

    it('should require admin role', async () => {
      await request(app)
        .post(`/api/admin/transfer/${testTransferId}/approve`)
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(403);
    });

    it('should return 404 for non-existent transfer', async () => {
      await request(app)
        .post('/api/admin/transfer/nonexistent-id/approve')
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .expect(404);
    });

    it('should reject already processed transfer', async () => {
      // First approve it
      await request(app)
        .post(`/api/admin/transfer/${testTransferId}/approve`)
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .send({ adminNotes: 'First approval' });

      // Try to approve again
      const response = await request(app)
        .post(`/api/admin/transfer/${testTransferId}/approve`)
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .send({ adminNotes: 'Second approval' })
        .expect(400);

      expect(response.body.message).toContain('not in pending status');
    });
  });

  describe('POST /api/admin/transfer/:id/reject', () => {
    let testTransferId: string;

    beforeEach(async () => {
      const transfer = await createTestTransfer(TEST_USERS.regularUser.id, {
        status: 'PENDING',
        amount: 500
      });
      testTransferId = transfer.id;
    });

    it('should reject pending transfer successfully', async () => {
      const response = await request(app)
        .post(`/api/admin/transfer/${testTransferId}/reject`)
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .send({
          rejectionReason: 'Invalid recipient account number'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('rejected'),
        data: {
          transaction: expect.objectContaining({
            id: testTransferId,
            status: 'REJECTED'
          })
        }
      });

      // Verify database update
      const dbTransaction = await testPrisma.transaction.findUnique({
        where: { id: testTransferId }
      });

      expect(dbTransaction?.status).toBe('REJECTED');
      expect(dbTransaction?.metadata).toMatchObject({
        rejectionReason: 'Invalid recipient account number',
        rejectedBy: TEST_USERS.adminUser.id,
        rejectedAt: expect.any(String)
      });
    });

    it('should require rejection reason', async () => {
      const response = await request(app)
        .post(`/api/admin/transfer/${testTransferId}/reject`)
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Rejection reason is required');
    });

    it('should require admin role', async () => {
      await request(app)
        .post(`/api/admin/transfer/${testTransferId}/reject`)
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(403);
    });
  });

  describe('GET /api/admin/transfer-stats', () => {
    beforeEach(async () => {
      // Create transfers with different statuses for stats
      await createTestTransfer(TEST_USERS.regularUser.id, { status: 'PENDING', amount: 100 });
      await createTestTransfer(TEST_USERS.regularUser.id, { status: 'COMPLETED', amount: 200 });
      await createTestTransfer(TEST_USERS.adminUser.id, { status: 'REJECTED', amount: 150 });
    });

    it('should return transfer statistics', async () => {
      const response = await request(app)
        .get('/api/admin/transfer-stats')
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          counts: {
            pending: expect.any(Number),
            processing: expect.any(Number),
            completed: expect.any(Number),
            rejected: expect.any(Number),
            failed: expect.any(Number),
            total: expect.any(Number)
          },
          totalVolume: expect.any(Number)
        }
      });

      // Verify counts are accurate
      expect(response.body.data.counts.pending).toBeGreaterThanOrEqual(1);
      expect(response.body.data.counts.completed).toBeGreaterThanOrEqual(1);
      expect(response.body.data.counts.rejected).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalVolume).toBeGreaterThan(0);
    });

    it('should require admin role', async () => {
      await request(app)
        .get('/api/admin/transfer-stats')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(403);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on transfer creation', async () => {
      const validTransferData = {
        amount: 10.00,
        currency: 'USD',
        recipientInfo: {
          name: 'Test User',
          accountNumber: '1234567890',
          bankCode: 'TEST123'
        }
      };

      // Make rapid requests to trigger rate limit
      const requests = Array.from({ length: 6 }, (_, i) =>
        request(app)
          .post('/api/user/transfer')
          .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
          .send({
            ...validTransferData,
            description: `Rapid test ${i}`
          })
      );

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000); // Longer timeout for rate limiting test
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very large payloads', async () => {
      const largeData = {
        amount: 100,
        currency: 'USD',
        recipientInfo: {
          name: 'Test User',
          accountNumber: '1234567890',
          bankCode: 'TEST123'
        },
        description: 'A'.repeat(100000) // Very large description
      };

      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send(largeData);

      // Should either accept with truncation or reject with proper error
      expect([200, 201, 400, 413]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousData = {
        amount: 100,
        currency: 'USD',
        recipientInfo: {
          name: "'; DROP TABLE transactions; --",
          accountNumber: '1234567890',
          bankCode: 'TEST123'
        }
      };

      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send(maliciousData);

      // Should handle safely (either accept and sanitize, or reject)
      expect([201, 400]).toContain(response.status);
      
      // Database should still be intact
      const userCount = await testPrisma.user.count();
      expect(userCount).toBe(3); // Our test users should still exist
    });
  });
});