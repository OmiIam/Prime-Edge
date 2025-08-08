/**
 * Socket.IO Service
 * Handles WebSocket connections, authentication, and real-time transfer notifications
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { sanitizeTransactionData } from '../utils/sanitizer';

const prisma = new PrismaClient();

// Extended Socket interface with user data
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

/**
 * Socket.IO Service for real-time transfer notifications
 */
export class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupAuthentication();
    this.setupEventHandlers();
    
    console.log('🔌 Socket.IO service initialized');
  }

  /**
   * Setup JWT authentication middleware for WebSocket connections
   */
  private setupAuthentication(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Extract token from auth or query parameters
        const token = socket.handshake.auth?.token || 
                     socket.handshake.query?.token as string;

        if (!token) {
          console.log('❌ Socket connection rejected: No token provided');
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'your-secret-key'
        ) as any;

        if (!decoded.userId) {
          console.log('❌ Socket connection rejected: Invalid token structure');
          return next(new Error('Invalid token structure'));
        }

        // Validate user exists and is active
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { 
            id: true, 
            email: true, 
            role: true, 
            isActive: true 
          }
        });

        if (!user || !user.isActive) {
          console.log('❌ Socket connection rejected: User not found or inactive');
          return next(new Error('User not found or inactive'));
        }

        // Attach user data to socket
        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.userRole = user.role;

        console.log(`✅ Socket authenticated: ${user.email} (${user.id})`);
        next();

      } catch (error) {
        console.log('❌ Socket authentication failed:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const userEmail = socket.userEmail!;

      console.log(`🔌 User connected: ${userEmail} (Socket: ${socket.id})`);

      // Track user connections for targeted messaging
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join user-specific room for targeted notifications
      socket.join(`user_${userId}`);

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to transfer notifications',
        userId: userId,
        timestamp: new Date().toISOString()
      });

      // Handle client requests for transfer updates
      socket.on('request_transfer_updates', async () => {
        try {
          console.log(`📡 Transfer updates requested via WebSocket: ${userId}`);
          await this.sendTransferUpdates(userId);
        } catch (error) {
          console.error('Error handling transfer updates request:', error);
          socket.emit('error', {
            message: 'Failed to fetch transfer updates',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle heartbeat/ping for connection monitoring
      socket.on('ping', () => {
        socket.emit('pong', { 
          timestamp: new Date().toISOString(),
          socketId: socket.id 
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 User disconnected: ${userEmail} (${reason})`);
        
        // Clean up socket tracking
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
            console.log(`📱 No active connections for user: ${userId}`);
          }
        }
      });
    });
  }

  /**
   * Send transfer updates to a specific user
   */
  private async sendTransferUpdates(userId: string): Promise<void> {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: userId,
          type: 'DEBIT',
          metadata: {
            path: ['transferType'],
            equals: 'external_bank'
          }
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
      });

      const sanitizedTransactions = transactions.map(sanitizeTransactionData);

      this.io.to(`user_${userId}`).emit('transfer_updates', {
        updates: sanitizedTransactions,
        count: sanitizedTransactions.length,
        timestamp: new Date().toISOString()
      });

      console.log(`📤 Sent ${sanitizedTransactions.length} transfer updates to user ${userId}`);
    } catch (error) {
      console.error(`Error sending transfer updates to user ${userId}:`, error);
    }
  }

  /**
   * Emit transfer_pending event when user creates a new transfer
   */
  public emitTransferPending(userId: string, transaction: any): void {
    try {
      const sanitizedTransaction = sanitizeTransactionData(transaction);
      
      const eventData = {
        transaction: sanitizedTransaction,
        message: `Your $${sanitizedTransaction.amount} transfer is pending approval`,
        timestamp: new Date().toISOString(),
        type: 'transfer_pending'
      };

      this.io.to(`user_${userId}`).emit('transfer_pending', eventData);
      
      console.log(`🚀 Emitted transfer_pending: User ${userId}, Transaction ${transaction.id}`);
    } catch (error) {
      console.error(`Error emitting transfer_pending for user ${userId}:`, error);
    }
  }

  /**
   * Emit transfer_update event when admin approves/rejects a transfer
   */
  public emitTransferUpdate(
    userId: string, 
    transaction: any, 
    status: 'approved' | 'rejected', 
    reason?: string
  ): void {
    try {
      const sanitizedTransaction = sanitizeTransactionData(transaction);
      
      const eventData = {
        transaction: sanitizedTransaction,
        status: status,
        reason: reason,
        message: status === 'approved' 
          ? `🎉 Your $${sanitizedTransaction.amount} transfer has been approved and processed!`
          : `❌ Your $${sanitizedTransaction.amount} transfer was rejected. ${reason || ''}`,
        timestamp: new Date().toISOString(),
        type: 'transfer_update'
      };

      this.io.to(`user_${userId}`).emit('transfer_update', eventData);
      
      console.log(`📣 Emitted transfer_update (${status}): User ${userId}, Transaction ${transaction.id}`);
    } catch (error) {
      console.error(`Error emitting transfer_update for user ${userId}:`, error);
    }
  }

  /**
   * Broadcast system notification to all connected users (admin use)
   */
  public broadcastSystemNotification(message: string, data?: any): void {
    try {
      this.io.emit('system_notification', {
        message: message,
        data: data,
        timestamp: new Date().toISOString()
      });

      console.log(`📢 System notification broadcast: ${message}`);
    } catch (error) {
      console.error('Error broadcasting system notification:', error);
    }
  }

  /**
   * Get connection statistics for monitoring
   */
  public getConnectionStats(): {
    totalConnections: number;
    uniqueUsers: number;
    userConnections: Record<string, number>;
  } {
    const userConnections: Record<string, number> = {};
    let totalConnections = 0;

    this.userSockets.forEach((sockets, userId) => {
      userConnections[userId] = sockets.size;
      totalConnections += sockets.size;
    });

    return {
      totalConnections,
      uniqueUsers: this.userSockets.size,
      userConnections
    };
  }

  /**
   * Check if a user has active WebSocket connections
   */
  public isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * Graceful shutdown of Socket.IO service
   */
  public async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🔄 Shutting down Socket.IO service...');
      
      this.io.close(() => {
        console.log('✅ Socket.IO service shut down successfully');
        this.userSockets.clear();
        resolve();
      });
    });
  }

  /**
   * Get Socket.IO server instance for advanced usage
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Singleton pattern for service management
let socketService: SocketService | null = null;

/**
 * Initialize the Socket.IO service with HTTP server
 */
export const initializeSocketService = (httpServer: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(httpServer);
  }
  return socketService;
};

/**
 * Get the initialized Socket.IO service instance
 */
export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error('Socket service not initialized. Call initializeSocketService first.');
  }
  return socketService;
};