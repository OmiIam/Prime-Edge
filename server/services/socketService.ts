/**
 * Socket.IO service for real-time transfer updates
 * Handles WebSocket connections, authentication, and user-specific event broadcasting
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { sanitizeTransactionData } from '../utils/responseUtils';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      // Connection timeout and configuration
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Authentication middleware for Socket.IO connections
   * Validates JWT token and attaches user info to socket
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Extract token from auth header or query parameter
        const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;
        
        if (!token) {
          console.log('❌ Socket connection rejected: No authentication token');
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        if (!decoded || !decoded.userId) {
          console.log('❌ Socket connection rejected: Invalid token');
          return next(new Error('Invalid authentication token'));
        }

        // Fetch user from database to ensure they still exist and are active
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, role: true, isActive: true }
        });

        if (!user || !user.isActive) {
          console.log('❌ Socket connection rejected: User not found or inactive');
          return next(new Error('User not found or inactive'));
        }

        // Attach user info to socket
        socket.userId = user.id;
        socket.user = user;
        
        console.log(`✅ Socket authenticated for user: ${user.email} (${user.id})`);
        next();

      } catch (error) {
        console.log('❌ Socket authentication error:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers for Socket.IO connections
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const socketId = socket.id;

      console.log(`🔌 User ${userId} connected via socket ${socketId}`);

      // Track user socket connections
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socketId);

      // Send initial connection confirmation
      socket.emit('connected', {
        message: 'Connected to transfer updates',
        userId: userId,
        timestamp: new Date().toISOString()
      });

      // Handle explicit transfer updates request
      socket.on('request_transfer_updates', async () => {
        try {
          console.log(`📡 User ${userId} requested transfer updates via WebSocket`);
          await this.sendTransferUpdates(userId);
        } catch (error) {
          console.error('Error handling transfer updates request:', error);
          socket.emit('error', { 
            message: 'Failed to fetch transfer updates',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle user joining their personal room for targeted messaging
      socket.join(`user_${userId}`);
      console.log(`👥 User ${userId} joined personal room`);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 User ${userId} disconnected (${reason}) from socket ${socketId}`);
        
        // Remove socket from user tracking
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socketId);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
            console.log(`📱 No more active connections for user ${userId}`);
          }
        }
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });
  }

  /**
   * Send transfer updates to a specific user
   */
  private async sendTransferUpdates(userId: string): Promise<void> {
    try {
      // Fetch recent transactions for the user
      const recentTransactions = await prisma.transaction.findMany({
        where: {
          userId: userId,
          type: 'DEBIT'
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
      });

      // Sanitize and filter relevant transactions
      const cleanTransactions = recentTransactions.map(transaction => sanitizeTransactionData(transaction));
      const transferUpdates = cleanTransactions.filter(transaction => {
        const metadata = transaction.metadata || {};
        return metadata.transferType === 'external_bank' || metadata.requiresApproval === true;
      });

      // Send to user's room
      this.io.to(`user_${userId}`).emit('transfer_updates', {
        updates: transferUpdates,
        timestamp: new Date().toISOString(),
        count: transferUpdates.length
      });

      console.log(`📤 Sent ${transferUpdates.length} transfer updates to user ${userId}`);
    } catch (error) {
      console.error(`Error sending transfer updates to user ${userId}:`, error);
    }
  }

  /**
   * Emit transfer pending event when user submits a new transfer
   */
  public emitTransferPending(userId: string, transaction: any): void {
    try {
      const cleanTransaction = sanitizeTransactionData(transaction);
      
      this.io.to(`user_${userId}`).emit('transfer_pending', {
        transaction: cleanTransaction,
        message: 'Your transfer has been submitted and is pending approval',
        timestamp: new Date().toISOString()
      });

      console.log(`🚀 Emitted transfer_pending to user ${userId} for transaction ${transaction.id}`);
    } catch (error) {
      console.error(`Error emitting transfer_pending to user ${userId}:`, error);
    }
  }

  /**
   * Emit transfer update event when admin approves/rejects a transfer
   */
  public emitTransferUpdate(userId: string, transaction: any, status: 'approved' | 'rejected', reason?: string): void {
    try {
      const cleanTransaction = sanitizeTransactionData(transaction);
      
      const eventData = {
        transaction: cleanTransaction,
        status: status,
        reason: reason,
        message: status === 'approved' 
          ? `Your transfer of $${cleanTransaction.amount} has been approved and processed!`
          : `Your transfer of $${cleanTransaction.amount} has been rejected. ${reason || ''}`,
        timestamp: new Date().toISOString()
      };

      this.io.to(`user_${userId}`).emit('transfer_update', eventData);

      console.log(`📣 Emitted transfer_update (${status}) to user ${userId} for transaction ${transaction.id}`);
    } catch (error) {
      console.error(`Error emitting transfer_update to user ${userId}:`, error);
    }
  }

  /**
   * Broadcast system message to all connected users (admin use)
   */
  public broadcastSystemMessage(message: string, data?: any): void {
    try {
      this.io.emit('system_message', {
        message: message,
        data: data,
        timestamp: new Date().toISOString()
      });

      console.log(`📢 Broadcasted system message: ${message}`);
    } catch (error) {
      console.error('Error broadcasting system message:', error);
    }
  }

  /**
   * Get connection statistics
   */
  public getStats(): { 
    totalConnections: number; 
    uniqueUsers: number; 
    userConnections: Record<string, number> 
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
   * Check if a user is connected
   */
  public isUserConnected(userId: string): boolean {
    const userSockets = this.userSockets.get(userId);
    return userSockets ? userSockets.size > 0 : false;
  }

  /**
   * Graceful shutdown
   */
  public shutdown(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🔄 Shutting down Socket.IO server...');
      this.io.close(() => {
        console.log('✅ Socket.IO server shut down successfully');
        resolve();
      });
    });
  }

  /**
   * Get the Socket.IO server instance for direct access if needed
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Export singleton instance
let socketService: SocketService | null = null;

export const initializeSocketService = (server: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(server);
    console.log('🚀 Socket.IO service initialized');
  }
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error('Socket service not initialized. Call initializeSocketService first.');
  }
  return socketService;
};