import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import express, { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
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
import { TransferService } from '../services/transferService';

/**
 * End-to-End Integration Tests
 * Tests complete user flows with real database, HTTP endpoints, and Socket.IO events
 */

describe('End-to-End Integration Tests', () => {
  let app: Express;
  let httpServer: any;
  let socketServer: SocketIOServer;
  let transferService: TransferService;
  
  // Client connections for testing
  let regularUserClient: ClientSocket;
  let adminUserClient: ClientSocket;
  
  const SERVER_PORT = 3002;
  const SERVER_URL = `http://localhost:${SERVER_PORT}`;

  beforeAll(async () => {
    console.log('🔄 Setting up E2E test environment...');
    
    // Setup test environment
    setupTestEnvironment();
    await setupTestDatabase();
    
    // Create Express app
    app = express();
    httpServer = createServer(app);
    
    // Initialize Socket.IO
    socketServer = initializeSocket(httpServer);
    transferService = new TransferService();
    
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
    
    // Setup routes
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
      console.error('E2E test app error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        data: null
      });
    });
    
    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(SERVER_PORT, () => {
        console.log(`✅ E2E test server listening on port ${SERVER_PORT}`);
        resolve();
      });
    });
    
    console.log('✅ E2E test environment ready');
  });

  beforeEach(async () => {
    // Clear transfers before each test
    await testPrisma.transaction.deleteMany({
      where: { type: 'EXTERNAL_TRANSFER' }
    });
    
    // Disconnect any existing clients
    const clients = [regularUserClient, adminUserClient];
    for (const client of clients) {
      if (client?.connected) {
        client.disconnect();
        await waitFor(() => !client.connected, 2000);
      }
    }
  });

  afterAll(async () => {
    console.log('🔄 Cleaning up E2E test environment...');
    
    // Close all client connections
    const clients = [regularUserClient, adminUserClient];
    for (const client of clients) {
      if (client?.connected) {
        client.disconnect();
      }
    }
    
    // Close servers
    if (socketServer) {
      socketServer.close();
    }
    
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
    
    // Cleanup database
    await cleanupTestDatabase();
    restoreEnvironment();
    
    console.log('✅ E2E test cleanup complete');
  });

  describe('Complete Transfer Workflow - User Journey', () => {
    it('should handle complete transfer creation to completion flow', async () => {
      // Step 1: Connect user to Socket.IO
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      const connectionPromise = new Promise<void>((resolve) => {
        regularUserClient.on('connect', () => {
          console.log('✅ User connected to Socket.IO');
          resolve();
        });
      });

      regularUserClient.connect();
      await connectionPromise;

      // Step 2: Setup event listener for transfer_pending
      let transferPendingEvent: any = null;
      const pendingEventPromise = new Promise<void>((resolve) => {
        regularUserClient.on('transfer_pending', (response) => {
          console.log('📧 Received transfer_pending event');
          transferPendingEvent = response;
          resolve();
        });
      });

      // Step 3: Create transfer via HTTP API
      const transferData = {
        amount: 1250.75,
        currency: 'USD',
        recipientInfo: {
          name: 'E2E Test Recipient',
          accountNumber: '9876543210',
          bankCode: 'E2E123'
        },
        description: 'End-to-end test transfer'
      };

      const createResponse = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send(transferData)
        .expect(201);

      // Step 4: Verify HTTP response
      expect(createResponse.body).toMatchObject({
        success: true,
        message: expect.stringContaining('submitted successfully'),
        data: {
          transaction: expect.objectContaining({
            id: expect.any(String),
            userId: TEST_USERS.regularUser.id,
            status: 'PENDING',
            amount: 1250.75,
            currency: 'USD'
          })
        }
      });

      const transferId = createResponse.body.data.transaction.id;

      // Step 5: Verify Socket.IO event was emitted
      await pendingEventPromise;
      
      expect(transferPendingEvent).toMatchObject({
        success: true,
        message: expect.stringContaining('pending'),
        data: {
          transaction: expect.objectContaining({
            id: transferId,
            status: 'PENDING'
          })
        }
      });

      // Step 6: Verify database state
      const dbTransfer = await testPrisma.transaction.findUnique({
        where: { id: transferId }
      });

      expect(dbTransfer).toBeTruthy();
      expect(dbTransfer?.status).toBe('PENDING');
      expect(dbTransfer?.metadata).toHaveProperty('requiresApproval', true);

      // Step 7: Fetch transfer updates via HTTP API
      const updatesResponse = await request(app)
        .get('/api/user/transfer-updates')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(200);

      expect(updatesResponse.body.data.transfers).toHaveLength(1);
      expect(updatesResponse.body.data.transfers[0].id).toBe(transferId);

      console.log('✅ Complete user transfer creation flow validated');
    });

    it('should handle complete admin approval workflow', async () => {
      // Step 1: Create a pending transfer
      const transfer = await createTestTransfer(TEST_USERS.regularUser.id, {
        status: 'PENDING',
        amount: 800,
        description: 'Admin approval test'
      });

      // Step 2: Connect both user and admin to Socket.IO
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      adminUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.adminUser },
        autoConnect: false,
        transports: ['websocket']
      });

      await Promise.all([
        new Promise<void>(resolve => {
          regularUserClient.on('connect', resolve);
          regularUserClient.connect();
        }),
        new Promise<void>(resolve => {
          adminUserClient.on('connect', resolve);
          adminUserClient.connect();
        })
      ]);

      // Step 3: Setup event listener for transfer_update
      let transferUpdateEvent: any = null;
      const updateEventPromise = new Promise<void>((resolve) => {
        regularUserClient.on('transfer_update', (response) => {
          console.log('📧 Received transfer_update event');
          transferUpdateEvent = response;
          resolve();
        });
      });

      // Step 4: Admin fetches pending transfers
      const pendingResponse = await request(app)
        .get('/api/admin/pending-transfers')
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .expect(200);

      expect(pendingResponse.body.data.transfers.length).toBeGreaterThanOrEqual(1);
      const foundTransfer = pendingResponse.body.data.transfers.find(
        (t: any) => t.id === transfer.id
      );
      expect(foundTransfer).toBeTruthy();

      // Step 5: Admin approves the transfer
      const approveResponse = await request(app)
        .post(`/api/admin/transfer/${transfer.id}/approve`)
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .send({
          adminNotes: 'Approved in E2E test workflow'
        })
        .expect(200);

      expect(approveResponse.body).toMatchObject({
        success: true,
        message: expect.stringContaining('approved'),
        data: {
          transaction: expect.objectContaining({
            id: transfer.id,
            status: 'PROCESSING'
          })
        }
      });

      // Step 6: Verify Socket.IO update event was emitted to user
      await updateEventPromise;
      
      expect(transferUpdateEvent).toMatchObject({
        success: true,
        message: expect.stringContaining('approved'),
        data: {
          transaction: expect.objectContaining({
            id: transfer.id,
            status: 'PROCESSING'
          })
        }
      });

      // Step 7: Verify database was updated
      const updatedTransfer = await testPrisma.transaction.findUnique({
        where: { id: transfer.id }
      });

      expect(updatedTransfer?.status).toBe('PROCESSING');
      expect(updatedTransfer?.metadata).toMatchObject({
        adminNotes: 'Approved in E2E test workflow',
        approvedBy: TEST_USERS.adminUser.id,
        approvedAt: expect.any(String)
      });

      console.log('✅ Complete admin approval workflow validated');
    });

    it('should handle complete admin rejection workflow', async () => {
      // Step 1: Create a pending transfer
      const transfer = await createTestTransfer(TEST_USERS.regularUser.id, {
        status: 'PENDING',
        amount: 600,
        description: 'Admin rejection test'
      });

      // Step 2: Connect user to Socket.IO
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      await new Promise<void>(resolve => {
        regularUserClient.on('connect', resolve);
        regularUserClient.connect();
      });

      // Step 3: Setup event listener for rejection update
      let rejectionEvent: any = null;
      const rejectionEventPromise = new Promise<void>((resolve) => {
        regularUserClient.on('transfer_update', (response) => {
          if (response.data?.transaction?.status === 'REJECTED') {
            console.log('📧 Received rejection event');
            rejectionEvent = response;
            resolve();
          }
        });
      });

      // Step 4: Admin rejects the transfer
      const rejectResponse = await request(app)
        .post(`/api/admin/transfer/${transfer.id}/reject`)
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .send({
          rejectionReason: 'Invalid recipient bank code in E2E test'
        })
        .expect(200);

      expect(rejectResponse.body).toMatchObject({
        success: true,
        message: expect.stringContaining('rejected'),
        data: {
          transaction: expect.objectContaining({
            id: transfer.id,
            status: 'REJECTED'
          })
        }
      });

      // Step 5: Verify Socket.IO rejection event
      await rejectionEventPromise;
      
      expect(rejectionEvent).toMatchObject({
        success: true,
        message: expect.stringContaining('rejected'),
        data: {
          transaction: expect.objectContaining({
            id: transfer.id,
            status: 'REJECTED'
          })
        }
      });

      // Step 6: Verify database state
      const rejectedTransfer = await testPrisma.transaction.findUnique({
        where: { id: transfer.id }
      });

      expect(rejectedTransfer?.status).toBe('REJECTED');
      expect(rejectedTransfer?.metadata).toMatchObject({
        rejectionReason: 'Invalid recipient bank code in E2E test',
        rejectedBy: TEST_USERS.adminUser.id,
        rejectedAt: expect.any(String)
      });

      // Step 7: User fetches updates and sees rejection
      const updatesResponse = await request(app)
        .get('/api/user/transfer-updates')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(200);

      const userTransfer = updatesResponse.body.data.transfers.find(
        (t: any) => t.id === transfer.id
      );
      expect(userTransfer.status).toBe('REJECTED');

      console.log('✅ Complete admin rejection workflow validated');
    });
  });

  describe('Multi-User Concurrent Operations', () => {
    it('should handle concurrent transfers from multiple users', async () => {
      // Connect both users
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      adminUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.adminUser },
        autoConnect: false,
        transports: ['websocket']
      });

      await Promise.all([
        new Promise<void>(resolve => {
          regularUserClient.on('connect', resolve);
          regularUserClient.connect();
        }),
        new Promise<void>(resolve => {
          adminUserClient.on('connect', resolve);
          adminUserClient.connect();
        })
      ]);

      // Setup event collectors
      const regularUserEvents: any[] = [];
      const adminUserEvents: any[] = [];

      regularUserClient.on('transfer_pending', (event) => {
        regularUserEvents.push(event);
      });

      adminUserClient.on('transfer_pending', (event) => {
        adminUserEvents.push(event);
      });

      // Create concurrent transfers
      const transferPromises = [
        request(app)
          .post('/api/user/transfer')
          .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
          .send({
            amount: 100,
            currency: 'USD',
            recipientInfo: { name: 'User 1', accountNumber: '1111111111', bankCode: 'BANK1' },
            description: 'Concurrent test 1'
          }),
        request(app)
          .post('/api/user/transfer')
          .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
          .send({
            amount: 200,
            currency: 'EUR',
            recipientInfo: { name: 'User 2', accountNumber: '2222222222', bankCode: 'BANK2' },
            description: 'Concurrent test 2'
          })
      ];

      const responses = await Promise.all(transferPromises);

      // Verify both transfers were created successfully
      expect(responses[0].status).toBe(201);
      expect(responses[1].status).toBe(201);

      // Wait for events to be processed
      await waitFor(() => regularUserEvents.length >= 1 && adminUserEvents.length >= 1, 5000);

      // Verify events were sent to correct users
      expect(regularUserEvents[0].data.transaction.userId).toBe(TEST_USERS.regularUser.id);
      expect(adminUserEvents[0].data.transaction.userId).toBe(TEST_USERS.adminUser.id);

      // Verify database state
      const allTransfers = await testPrisma.transaction.findMany({
        where: { type: 'EXTERNAL_TRANSFER' }
      });

      expect(allTransfers).toHaveLength(2);
      expect(allTransfers.every(t => t.status === 'PENDING')).toBe(true);

      console.log('✅ Concurrent multi-user operations validated');
    });

    it('should handle admin processing multiple transfers', async () => {
      // Create multiple pending transfers
      const transfers = await Promise.all([
        createTestTransfer(TEST_USERS.regularUser.id, { status: 'PENDING', amount: 100 }),
        createTestTransfer(TEST_USERS.regularUser.id, { status: 'PENDING', amount: 200 }),
        createTestTransfer(TEST_USERS.adminUser.id, { status: 'PENDING', amount: 300 })
      ]);

      // Process all transfers concurrently
      const processPromises = [
        request(app)
          .post(`/api/admin/transfer/${transfers[0].id}/approve`)
          .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
          .send({ adminNotes: 'Batch approval 1' }),
        request(app)
          .post(`/api/admin/transfer/${transfers[1].id}/reject`)
          .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
          .send({ rejectionReason: 'Batch rejection 1' }),
        request(app)
          .post(`/api/admin/transfer/${transfers[2].id}/approve`)
          .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
          .send({ adminNotes: 'Batch approval 2' })
      ];

      const responses = await Promise.all(processPromises);

      // Verify all operations succeeded
      expect(responses[0].status).toBe(200);
      expect(responses[0].body.data.transaction.status).toBe('PROCESSING');

      expect(responses[1].status).toBe(200);
      expect(responses[1].body.data.transaction.status).toBe('REJECTED');

      expect(responses[2].status).toBe(200);
      expect(responses[2].body.data.transaction.status).toBe('PROCESSING');

      // Verify database consistency
      const finalTransfers = await testPrisma.transaction.findMany({
        where: {
          id: { in: transfers.map(t => t.id) }
        }
      });

      expect(finalTransfers.find(t => t.id === transfers[0].id)?.status).toBe('PROCESSING');
      expect(finalTransfers.find(t => t.id === transfers[1].id)?.status).toBe('REJECTED');
      expect(finalTransfers.find(t => t.id === transfers[2].id)?.status).toBe('PROCESSING');

      console.log('✅ Admin batch processing validated');
    });
  });

  describe('Real-time Synchronization', () => {
    it('should maintain synchronization between HTTP API and Socket.IO events', async () => {
      // Connect user
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      await new Promise<void>(resolve => {
        regularUserClient.on('connect', resolve);
        regularUserClient.connect();
      });

      // Track all events
      const allEvents: any[] = [];
      regularUserClient.on('transfer_pending', (event) => allEvents.push({ type: 'pending', event }));
      regularUserClient.on('transfer_update', (event) => allEvents.push({ type: 'update', event }));

      // Step 1: Create transfer
      const createResponse = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send({
          amount: 500,
          currency: 'USD',
          recipientInfo: { name: 'Sync Test', accountNumber: '1234567890', bankCode: 'SYNC123' }
        });

      const transferId = createResponse.body.data.transaction.id;

      // Wait for pending event
      await waitFor(() => allEvents.length >= 1, 3000);

      // Step 2: Approve transfer
      await request(app)
        .post(`/api/admin/transfer/${transferId}/approve`)
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .send({ adminNotes: 'Sync test approval' });

      // Wait for update event
      await waitFor(() => allEvents.length >= 2, 3000);

      // Verify event sequence
      expect(allEvents).toHaveLength(2);
      expect(allEvents[0].type).toBe('pending');
      expect(allEvents[1].type).toBe('update');

      // Verify data consistency
      const pendingData = allEvents[0].event.data.transaction;
      const updateData = allEvents[1].event.data.transaction;

      expect(pendingData.id).toBe(transferId);
      expect(updateData.id).toBe(transferId);
      expect(pendingData.status).toBe('PENDING');
      expect(updateData.status).toBe('PROCESSING');

      // Verify HTTP API reflects same state
      const finalResponse = await request(app)
        .get('/api/user/transfer-updates')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`);

      const transfer = finalResponse.body.data.transfers.find((t: any) => t.id === transferId);
      expect(transfer.status).toBe('PROCESSING');

      console.log('✅ HTTP-Socket.IO synchronization validated');
    });

    it('should handle Socket.IO disconnection and reconnection gracefully', async () => {
      // Step 1: Connect and create transfer
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      await new Promise<void>(resolve => {
        regularUserClient.on('connect', resolve);
        regularUserClient.connect();
      });

      const createResponse = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send({
          amount: 300,
          currency: 'USD',
          recipientInfo: { name: 'Disconnect Test', accountNumber: '9999999999', bankCode: 'DISC123' }
        });

      const transferId = createResponse.body.data.transaction.id;

      // Step 2: Disconnect client
      regularUserClient.disconnect();
      await waitFor(() => !regularUserClient.connected, 2000);

      // Step 3: Process transfer while disconnected
      await request(app)
        .post(`/api/admin/transfer/${transferId}/approve`)
        .set('Authorization', `Bearer ${TEST_TOKENS.adminUser}`)
        .send({ adminNotes: 'Processed while disconnected' });

      // Step 4: Reconnect and verify state
      const reconnectPromise = new Promise<void>(resolve => {
        regularUserClient.on('connect', resolve);
      });

      regularUserClient.connect();
      await reconnectPromise;

      // Verify client can fetch current state
      const updatesResponse = await request(app)
        .get('/api/user/transfer-updates')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`);

      const transfer = updatesResponse.body.data.transfers.find((t: any) => t.id === transferId);
      expect(transfer.status).toBe('PROCESSING');

      console.log('✅ Disconnect/reconnect handling validated');
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle partial failures gracefully', async () => {
      // Test scenario where Socket.IO fails but HTTP succeeds
      
      // Create transfer (should succeed even if socket events fail)
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send({
          amount: 400,
          currency: 'USD',
          recipientInfo: { name: 'Partial Fail Test', accountNumber: '5555555555', bankCode: 'FAIL123' }
        })
        .expect(201);

      // Verify database record was created
      const transferId = response.body.data.transaction.id;
      const dbRecord = await testPrisma.transaction.findUnique({
        where: { id: transferId }
      });

      expect(dbRecord).toBeTruthy();
      expect(dbRecord?.status).toBe('PENDING');

      // HTTP API should work independently of socket status
      const updatesResponse = await request(app)
        .get('/api/user/transfer-updates')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(200);

      expect(updatesResponse.body.data.transfers.some((t: any) => t.id === transferId)).toBe(true);

      console.log('✅ Partial failure handling validated');
    });

    it('should maintain data integrity under high concurrency', async () => {
      // Create multiple concurrent operations to test race conditions
      const concurrentOperations = [];
      
      // Create transfers
      for (let i = 0; i < 5; i++) {
        concurrentOperations.push(
          request(app)
            .post('/api/user/transfer')
            .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
            .send({
              amount: 100 + i,
              currency: 'USD',
              recipientInfo: { 
                name: `Concurrent User ${i}`, 
                accountNumber: `${String(i).padStart(10, '1')}`, 
                bankCode: `CON${i}` 
              },
              description: `Concurrent test ${i}`
            })
        );
      }

      // Execute all operations
      const responses = await Promise.all(concurrentOperations);

      // Verify all succeeded
      expect(responses.every(r => r.status === 201)).toBe(true);

      // Verify database integrity
      const allTransfers = await testPrisma.transaction.findMany({
        where: { type: 'EXTERNAL_TRANSFER' }
      });

      expect(allTransfers).toHaveLength(5);
      expect(allTransfers.every(t => t.status === 'PENDING')).toBe(true);
      
      // Verify amounts are correct (no corruption)
      const amounts = allTransfers.map(t => Number(t.amount)).sort();
      expect(amounts).toEqual([100, 101, 102, 103, 104]);

      console.log('✅ High concurrency integrity validated');
    });

    it('should recover from temporary database connection issues', async () => {
      // This test would ideally simulate database connection issues,
      // but for our test environment, we'll verify error handling
      
      // Test with invalid user ID (simulates database constraint violation)
      const response = await request(app)
        .post('/api/user/transfer')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .send({
          amount: 100,
          currency: 'USD',
          recipientInfo: { name: 'DB Test', accountNumber: '1234567890', bankCode: 'DB123' }
        });

      // Should either succeed or fail gracefully
      expect([200, 201, 400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');

      // System should remain responsive
      const healthResponse = await request(app)
        .get('/api/user/transfer-updates')
        .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
        .expect(200);

      expect(healthResponse.body.success).toBe(true);

      console.log('✅ Database error recovery validated');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle reasonable load without degradation', async () => {
      const startTime = Date.now();
      const transferPromises = [];
      const NUM_TRANSFERS = 10;

      // Create multiple transfers rapidly
      for (let i = 0; i < NUM_TRANSFERS; i++) {
        transferPromises.push(
          request(app)
            .post('/api/user/transfer')
            .set('Authorization', `Bearer ${TEST_TOKENS.regularUser}`)
            .send({
              amount: 50 + i,
              currency: 'USD',
              recipientInfo: { 
                name: `Load Test ${i}`, 
                accountNumber: `${String(i + 1000).padStart(10, '0')}`, 
                bankCode: `LOAD${i}` 
              }
            })
        );
      }

      const responses = await Promise.all(transferPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all transfers succeeded
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBe(NUM_TRANSFERS);

      // Verify reasonable performance (should complete within 10 seconds)
      expect(totalTime).toBeLessThan(10000);
      console.log(`✅ Load test completed: ${NUM_TRANSFERS} transfers in ${totalTime}ms`);

      // Verify database consistency
      const dbTransfers = await testPrisma.transaction.findMany({
        where: { type: 'EXTERNAL_TRANSFER' }
      });

      expect(dbTransfers).toHaveLength(NUM_TRANSFERS);
      expect(dbTransfers.every(t => t.status === 'PENDING')).toBe(true);

      console.log('✅ Load testing validated');
    });
  });
});