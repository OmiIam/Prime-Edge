import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { sanitizeTransactionData } from '../utils/sanitizeTransactionData';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export class TransferSocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:3000',
          'https://www.primeedgefinancebank.com',
          'https://primeedgefinancebank.com',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupAuthentication();
    this.setupConnectionHandlers();
  }

  private setupAuthentication() {
    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          console.log('Socket connection rejected: No token provided');
          return next(new Error('Authentication token required'));
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          console.error('JWT_SECRET environment variable is not set');
          return next(new Error('Server configuration error'));
        }

        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;
        
        console.log(`Socket authenticated for user: ${decoded.email} (${decoded.userId})`);
        next();
      } catch (error) {
        console.log('Socket authentication failed:', error instanceof Error ? error.message : 'Unknown error');
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.userId) {
        socket.disconnect();
        return;
      }

      console.log(`User connected: ${socket.userEmail} (${socket.userId})`);

      // Join user-specific room
      const userRoom = `user:${socket.userId}`;
      socket.join(userRoom);

      // Track connection
      if (!this.connectedUsers.has(socket.userId)) {
        this.connectedUsers.set(socket.userId, new Set());
      }
      this.connectedUsers.get(socket.userId)!.add(socket.id);

      // Handle transfer update requests
      socket.on('request_transfer_updates', async () => {
        try {
          console.log(`Transfer updates requested by user: ${socket.userId}`);
          // Could implement real-time update fetching here if needed
          // For now, the polling fallback handles this
          socket.emit('transfer_updates_requested', {
            message: 'Use polling fallback endpoint /api/user/transfer-updates',
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error handling transfer updates request:', error);
          socket.emit('error', {
            message: 'Failed to fetch transfer updates',
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong', {
          timestamp: new Date().toISOString(),
          userId: socket.userId,
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.userEmail} (${socket.userId}) - ${reason}`);
        
        if (socket.userId && this.connectedUsers.has(socket.userId)) {
          const userSockets = this.connectedUsers.get(socket.userId)!;
          userSockets.delete(socket.id);
          
          if (userSockets.size === 0) {
            this.connectedUsers.delete(socket.userId);
            console.log(`All connections closed for user: ${socket.userId}`);
          }
        }
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to transfer updates service',
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Emits a transfer_pending event to the user who created the transfer
   */
  emitTransferPending(userId: string, transaction: any) {
    try {
      const sanitizedTransaction = sanitizeTransactionData(transaction);
      const userRoom = `user:${userId}`;
      
      console.log(`Emitting transfer_pending to user ${userId}:`, sanitizedTransaction?.id);
      
      this.io.to(userRoom).emit('transfer_pending', {
        transaction: sanitizedTransaction,
        message: 'Your transfer has been submitted and is awaiting approval',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error emitting transfer_pending:', error);
    }
  }

  /**
   * Emits a transfer_update event to the user when transfer is approved/rejected
   */
  emitTransferUpdate(userId: string, transaction: any) {
    try {
      const sanitizedTransaction = sanitizeTransactionData(transaction);
      const userRoom = `user:${userId}`;
      
      console.log(`Emitting transfer_update to user ${userId}:`, sanitizedTransaction?.id, sanitizedTransaction?.status);
      
      let message = 'Your transfer has been updated';
      if (sanitizedTransaction?.status === 'COMPLETED') {
        message = 'Your transfer has been approved and completed successfully';
      } else if (sanitizedTransaction?.status === 'REJECTED') {
        message = 'Your transfer has been rejected';
      } else if (sanitizedTransaction?.status === 'FAILED') {
        message = 'Your transfer failed to process';
      } else if (sanitizedTransaction?.status === 'PROCESSING') {
        message = 'Your transfer has been approved and is being processed';
      }

      this.io.to(userRoom).emit('transfer_update', {
        transaction: sanitizedTransaction,
        message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error emitting transfer_update:', error);
    }
  }

  /**
   * Emits a system-wide notification (for maintenance, etc.)
   */
  emitSystemNotification(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    try {
      console.log(`Emitting system notification (${level}):`, message);
      
      this.io.emit('system_notification', {
        message,
        level,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error emitting system notification:', error);
    }
  }

  /**
   * Gets connection statistics
   */
  getConnectionStats() {
    const totalConnections = Array.from(this.connectedUsers.values())
      .reduce((sum, sockets) => sum + sockets.size, 0);

    return {
      connectedUsers: this.connectedUsers.size,
      totalConnections,
      userConnections: Array.from(this.connectedUsers.entries()).map(([userId, sockets]) => ({
        userId,
        connections: sockets.size,
      })),
    };
  }

  /**
   * Gracefully shuts down the socket service
   */
  async shutdown() {
    console.log('Shutting down Socket.IO service...');
    
    // Notify all connected clients
    this.emitSystemNotification('Server maintenance in progress. Please reconnect in a few minutes.', 'warning');
    
    // Wait a bit for message delivery
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Close all connections
    this.io.close();
    this.connectedUsers.clear();
    
    console.log('Socket.IO service shut down complete');
  }
}

// Global socket service instance
let socketService: TransferSocketService | null = null;

export function initializeSocketService(httpServer: HttpServer): TransferSocketService {
  if (socketService) {
    console.log('Socket service already initialized');
    return socketService;
  }

  socketService = new TransferSocketService(httpServer);
  console.log('Socket.IO service initialized');
  return socketService;
}

export function getSocketService(): TransferSocketService {
  if (!socketService) {
    throw new Error('Socket service not initialized. Call initializeSocketService first.');
  }
  return socketService;
}