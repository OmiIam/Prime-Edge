import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import { createServer } from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';

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

import { initializeSocket, getSocketService } from '../socket/socket';
import { TransferService } from '../services/transferService';

/**
 * Socket.IO Real-time Event Tests
 * Tests Socket.IO authentication, room management, and event emission
 */

describe('Socket.IO Event Tests', () => {
  let httpServer: any;
  let socketServer: SocketIOServer;
  let transferService: TransferService;
  
  // Client connections for testing
  let regularUserClient: ClientSocket;
  let adminUserClient: ClientSocket;
  let unauthenticatedClient: ClientSocket;
  
  const SERVER_PORT = 3001;
  const SERVER_URL = `http://localhost:${SERVER_PORT}`;

  beforeAll(async () => {
    console.log('🔌 Setting up Socket.IO test environment...');
    
    // Setup test environment
    setupTestEnvironment();
    await setupTestDatabase();
    
    // Create test server
    const app = express();
    httpServer = createServer(app);
    
    // Initialize Socket.IO server
    socketServer = initializeSocket(httpServer);
    transferService = new TransferService();
    
    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(SERVER_PORT, () => {
        console.log(`✅ Test server listening on port ${SERVER_PORT}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    console.log('🔌 Cleaning up Socket.IO test environment...');
    
    // Close all client connections
    const clients = [regularUserClient, adminUserClient, unauthenticatedClient];
    for (const client of clients) {
      if (client?.connected) {
        client.disconnect();
      }
    }
    
    // Close socket server
    if (socketServer) {
      socketServer.close();
    }
    
    // Close HTTP server
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
    
    // Cleanup database
    await cleanupTestDatabase();
    restoreEnvironment();
    
    console.log('✅ Socket.IO test cleanup complete');
  });

  beforeEach(async () => {
    // Clear any existing transfers
    await testPrisma.transaction.deleteMany({
      where: { type: 'EXTERNAL_TRANSFER' }
    });
    
    // Disconnect any existing clients
    const clients = [regularUserClient, adminUserClient, unauthenticatedClient];
    for (const client of clients) {
      if (client?.connected) {
        client.disconnect();
        await waitFor(() => !client.connected, 2000);
      }
    }
  });

  describe('Socket.IO Authentication', () => {
    it('should authenticate valid JWT token', async () => {
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      const connectionPromise = new Promise<void>((resolve, reject) => {
        regularUserClient.on('connect', () => {
          console.log('✅ Regular user client connected');
          resolve();
        });
        
        regularUserClient.on('connect_error', (error) => {
          reject(new Error(`Connection failed: ${error.message}`));
        });
        
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      regularUserClient.connect();
      await connectionPromise;
      
      expect(regularUserClient.connected).toBe(true);
    });

    it('should reject invalid JWT token', async () => {
      unauthenticatedClient = ClientIO(SERVER_URL, {
        auth: { token: 'invalid-token' },
        autoConnect: false,
        transports: ['websocket']
      });

      const errorPromise = new Promise<void>((resolve, reject) => {
        unauthenticatedClient.on('connect', () => {
          reject(new Error('Should not have connected with invalid token'));
        });
        
        unauthenticatedClient.on('connect_error', (error) => {
          console.log('✅ Invalid token rejected:', error.message);
          resolve();
        });
        
        setTimeout(() => reject(new Error('No connection error received')), 5000);
      });

      unauthenticatedClient.connect();
      await errorPromise;
      
      expect(unauthenticatedClient.connected).toBe(false);
    });

    it('should reject missing token', async () => {
      unauthenticatedClient = ClientIO(SERVER_URL, {
        autoConnect: false,
        transports: ['websocket']
      });

      const errorPromise = new Promise<void>((resolve, reject) => {
        unauthenticatedClient.on('connect', () => {
          reject(new Error('Should not have connected without token'));
        });
        
        unauthenticatedClient.on('connect_error', (error) => {
          console.log('✅ Missing token rejected:', error.message);
          resolve();
        });
        
        setTimeout(() => reject(new Error('No connection error received')), 3000);
      });

      unauthenticatedClient.connect();
      await errorPromise;
      
      expect(unauthenticatedClient.connected).toBe(false);
    });

    it('should authenticate admin user correctly', async () => {
      adminUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.adminUser },
        autoConnect: false,
        transports: ['websocket']
      });

      const connectionPromise = new Promise<void>((resolve, reject) => {
        adminUserClient.on('connect', () => {
          console.log('✅ Admin user client connected');
          resolve();
        });
        
        adminUserClient.on('connect_error', (error) => {
          reject(new Error(`Admin connection failed: ${error.message}`));
        });
        
        setTimeout(() => reject(new Error('Admin connection timeout')), 5000);
      });

      adminUserClient.connect();
      await connectionPromise;
      
      expect(adminUserClient.connected).toBe(true);
    });

    it('should reject inactive user token', async () => {
      unauthenticatedClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.inactiveUser },
        autoConnect: false,
        transports: ['websocket']
      });

      const errorPromise = new Promise<void>((resolve, reject) => {
        unauthenticatedClient.on('connect', () => {
          reject(new Error('Should not have connected with inactive user token'));
        });
        
        unauthenticatedClient.on('connect_error', (error) => {
          console.log('✅ Inactive user token rejected:', error.message);
          resolve();
        });
        
        setTimeout(() => reject(new Error('No connection error for inactive user')), 5000);
      });

      unauthenticatedClient.connect();
      await errorPromise;
      
      expect(unauthenticatedClient.connected).toBe(false);
    });
  });

  describe('Transfer Event Emission', () => {
    beforeEach(async () => {
      // Connect clients before each test
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

      // Connect both clients
      const regularConnection = new Promise<void>((resolve) => {
        regularUserClient.on('connect', resolve);
      });
      const adminConnection = new Promise<void>((resolve) => {
        adminUserClient.on('connect', resolve);
      });

      regularUserClient.connect();
      adminUserClient.connect();

      await Promise.all([regularConnection, adminConnection]);
    });

    it('should emit transfer_pending event when transfer is created', async () => {
      const eventPromise = new Promise<any>((resolve, reject) => {
        regularUserClient.on('transfer_pending', (response) => {
          console.log('📧 Received transfer_pending event:', response);
          resolve(response);
        });
        
        setTimeout(() => reject(new Error('transfer_pending event timeout')), 10000);
      });

      // Create transfer using the service
      const transferData = {
        amount: 750.00,
        currency: 'USD',
        recipientInfo: {
          name: 'Socket Test User',
          accountNumber: '9876543210',
          bankCode: 'SOCKET123'
        },
        description: 'Socket.IO test transfer'
      };

      const createdTransfer = await transferService.createTransfer(
        TEST_USERS.regularUser.id,
        transferData
      );

      const eventResponse = await eventPromise;

      expect(eventResponse).toMatchObject({
        success: true,
        message: expect.stringContaining('pending'),
        data: {
          transaction: expect.objectContaining({
            id: createdTransfer.id,
            userId: TEST_USERS.regularUser.id,
            status: 'PENDING',
            amount: 750,
            currency: 'USD',
            type: 'EXTERNAL_TRANSFER'
          })
        }
      });
    });

    it('should emit transfer_update event when transfer is approved', async () => {
      // Create a pending transfer first
      const transfer = await createTestTransfer(TEST_USERS.regularUser.id, {
        status: 'PENDING',
        amount: 500
      });

      const eventPromise = new Promise<any>((resolve, reject) => {
        regularUserClient.on('transfer_update', (response) => {
          console.log('📧 Received transfer_update event:', response);
          resolve(response);
        });
        
        setTimeout(() => reject(new Error('transfer_update event timeout')), 10000);
      });

      // Approve the transfer
      const approvedTransfer = await transferService.approveTransfer(
        transfer.id,
        TEST_USERS.adminUser.id,
        'Socket test approval'
      );

      const eventResponse = await eventPromise;

      expect(eventResponse).toMatchObject({
        success: true,
        message: expect.stringContaining('approved'),
        data: {
          transaction: expect.objectContaining({
            id: transfer.id,
            status: 'PROCESSING'
          })
        }
      });
    });

    it('should emit transfer_update event when transfer is rejected', async () => {
      // Create a pending transfer
      const transfer = await createTestTransfer(TEST_USERS.regularUser.id, {
        status: 'PENDING',
        amount: 300
      });

      const eventPromise = new Promise<any>((resolve, reject) => {
        regularUserClient.on('transfer_update', (response) => {
          console.log('📧 Received transfer_update event (rejection):', response);
          resolve(response);
        });
        
        setTimeout(() => reject(new Error('transfer_update rejection event timeout')), 10000);
      });

      // Reject the transfer
      await transferService.rejectTransfer(
        transfer.id,
        TEST_USERS.adminUser.id,
        'Socket test rejection'
      );

      const eventResponse = await eventPromise;

      expect(eventResponse).toMatchObject({
        success: true,
        message: expect.stringContaining('rejected'),
        data: {
          transaction: expect.objectContaining({
            id: transfer.id,
            status: 'REJECTED'
          })
        }
      });
    });

    it('should only send events to the relevant user', async () => {
      // Setup event listeners for both clients
      let regularUserEvents: any[] = [];
      let adminUserEvents: any[] = [];

      regularUserClient.on('transfer_pending', (response) => {
        regularUserEvents.push(response);
      });

      adminUserClient.on('transfer_pending', (response) => {
        adminUserEvents.push(response);
      });

      // Wait a bit for event setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create transfer for regular user
      await transferService.createTransfer(TEST_USERS.regularUser.id, {
        amount: 100,
        currency: 'USD',
        recipientInfo: {
          name: 'Test User',
          accountNumber: '1234567890',
          bankCode: 'TEST123'
        }
      });

      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Regular user should receive the event
      expect(regularUserEvents.length).toBe(1);
      expect(regularUserEvents[0].data.transaction.userId).toBe(TEST_USERS.regularUser.id);

      // Admin user should NOT receive this event (it's user-specific)
      expect(adminUserEvents.length).toBe(0);
    });

    it('should handle concurrent event emissions', async () => {
      const eventPromises: Promise<any>[] = [];
      const receivedEvents: any[] = [];

      regularUserClient.on('transfer_pending', (response) => {
        receivedEvents.push(response);
      });

      // Create multiple transfers concurrently
      const transfers = await Promise.all([
        transferService.createTransfer(TEST_USERS.regularUser.id, {
          amount: 100,
          currency: 'USD',
          recipientInfo: { name: 'User 1', accountNumber: '1111111111', bankCode: 'BANK1' }
        }),
        transferService.createTransfer(TEST_USERS.regularUser.id, {
          amount: 200,
          currency: 'EUR',
          recipientInfo: { name: 'User 2', accountNumber: '2222222222', bankCode: 'BANK2' }
        }),
        transferService.createTransfer(TEST_USERS.regularUser.id, {
          amount: 300,
          currency: 'GBP',
          recipientInfo: { name: 'User 3', accountNumber: '3333333333', bankCode: 'BANK3' }
        })
      ]);

      // Wait for all events to be received
      await waitFor(() => receivedEvents.length === 3, 5000);

      expect(receivedEvents).toHaveLength(3);
      
      // Check that all transfers are represented
      const transferIds = transfers.map(t => t.id).sort();
      const eventTransferIds = receivedEvents.map(e => e.data.transaction.id).sort();
      expect(eventTransferIds).toEqual(transferIds);
    });
  });

  describe('Socket Service Statistics', () => {
    beforeEach(async () => {
      // Connect test clients
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      const connectionPromise = new Promise<void>((resolve) => {
        regularUserClient.on('connect', resolve);
      });

      regularUserClient.connect();
      await connectionPromise;
    });

    it('should track connected users correctly', async () => {
      const socketService = getSocketService();
      const stats = socketService.getStats();

      expect(stats).toMatchObject({
        connectedUsers: expect.any(Number),
        totalConnections: expect.any(Number),
        rooms: expect.any(Array)
      });

      expect(stats.connectedUsers).toBeGreaterThan(0);
      expect(stats.totalConnections).toBeGreaterThan(0);
      expect(stats.rooms.some((room: string) => room.includes(TEST_USERS.regularUser.id))).toBe(true);
    });

    it('should update stats when clients disconnect', async () => {
      const socketService = getSocketService();
      const initialStats = socketService.getStats();
      const initialConnections = initialStats.connectedUsers;

      // Disconnect client
      regularUserClient.disconnect();
      await waitFor(() => !regularUserClient.connected, 2000);

      // Wait a bit for server to update stats
      await new Promise(resolve => setTimeout(resolve, 500));

      const finalStats = socketService.getStats();
      expect(finalStats.connectedUsers).toBeLessThan(initialConnections);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      const connectionPromise = new Promise<void>((resolve) => {
        regularUserClient.on('connect', resolve);
      });

      regularUserClient.connect();
      await connectionPromise;
    });

    it('should handle client reconnection gracefully', async () => {
      let reconnectCount = 0;
      
      regularUserClient.on('reconnect', () => {
        reconnectCount++;
        console.log(`🔄 Client reconnected (attempt ${reconnectCount})`);
      });

      // Simulate network interruption
      regularUserClient.disconnect();
      await waitFor(() => !regularUserClient.connected, 2000);

      // Reconnect
      regularUserClient.connect();
      await waitFor(() => regularUserClient.connected, 5000);

      expect(regularUserClient.connected).toBe(true);
    });

    it('should handle server event emission errors gracefully', async () => {
      // This tests that the server doesn't crash when trying to emit to disconnected clients
      
      // Disconnect client
      regularUserClient.disconnect();
      await waitFor(() => !regularUserClient.connected, 2000);

      // Try to create transfer (should not crash even if client is disconnected)
      const transferCreation = async () => {
        return await transferService.createTransfer(TEST_USERS.regularUser.id, {
          amount: 100,
          currency: 'USD',
          recipientInfo: {
            name: 'Disconnected Test',
            accountNumber: '1234567890',
            bankCode: 'TEST123'
          }
        });
      };

      // Should not throw an error
      await expect(transferCreation()).resolves.toBeTruthy();
    });

    it('should validate event data before emission', async () => {
      const eventPromise = new Promise<any>((resolve, reject) => {
        regularUserClient.on('transfer_pending', (response) => {
          resolve(response);
        });
        
        setTimeout(() => reject(new Error('Event timeout')), 5000);
      });

      // Create transfer
      const transfer = await transferService.createTransfer(TEST_USERS.regularUser.id, {
        amount: 50,
        currency: 'USD',
        recipientInfo: {
          name: 'Validation Test',
          accountNumber: '1234567890',
          bankCode: 'VALID123'
        }
      });

      const eventResponse = await eventPromise;

      // Event should have proper structure
      expect(eventResponse).toHaveProperty('success');
      expect(eventResponse).toHaveProperty('message');
      expect(eventResponse).toHaveProperty('data');
      expect(eventResponse.data).toHaveProperty('transaction');

      // Transaction data should be sanitized (no circular references)
      const transaction = eventResponse.data.transaction;
      expect(transaction).not.toHaveProperty('user');
      expect(transaction).not.toHaveProperty('__proto__');
      expect(typeof transaction.amount).toBe('number');
    });

    it('should handle malformed socket events gracefully', async () => {
      // This would test server robustness against client-sent malformed data
      // For now, we verify that the server is still responsive after connection
      
      const pingPromise = new Promise<void>((resolve, reject) => {
        regularUserClient.emit('ping', (response: any) => {
          resolve();
        });
        
        setTimeout(() => reject(new Error('Ping timeout')), 3000);
      });

      // Test that server is still responsive
      const isServerResponsive = async () => {
        try {
          await pingPromise;
          return true;
        } catch {
          return false;
        }
      };

      // Server should be responsive even after potential malformed events
      expect(await isServerResponsive()).toBe(true);
    });
  });

  describe('System Notifications', () => {
    beforeEach(async () => {
      regularUserClient = ClientIO(SERVER_URL, {
        auth: { token: TEST_TOKENS.regularUser },
        autoConnect: false,
        transports: ['websocket']
      });

      const connectionPromise = new Promise<void>((resolve) => {
        regularUserClient.on('connect', resolve);
      });

      regularUserClient.connect();
      await connectionPromise;
    });

    it('should handle system_notification events', async () => {
      const notificationPromise = new Promise<any>((resolve) => {
        regularUserClient.on('system_notification', (response) => {
          resolve(response);
        });
      });

      // Emit a system notification through the socket service
      const socketService = getSocketService();
      socketService.emitSystemNotification({
        success: true,
        message: 'System maintenance scheduled',
        data: {
          level: 'info',
          scheduledTime: new Date().toISOString()
        }
      });

      const notification = await notificationPromise;

      expect(notification).toMatchObject({
        success: true,
        message: 'System maintenance scheduled',
        data: {
          level: 'info',
          scheduledTime: expect.any(String)
        }
      });
    });
  });
});