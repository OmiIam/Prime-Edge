import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  role?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, Set<string>>(); // userId -> socketIds

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://www.primeedgefinancebank.com',
          'https://primeedgefinancebank.com'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupAuthentication();
    this.setupConnectionHandlers();
  }

  private setupAuthentication() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          console.log('[Socket] Authentication failed: No token provided');
          return next(new Error('Authentication token required'));
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          console.error('[Socket] JWT_SECRET not configured');
          return next(new Error('Server configuration error'));
        }

        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        
        socket.userId = decoded.userId;
        socket.email = decoded.email;
        socket.role = decoded.role;
        
        console.log(`[Socket] User authenticated: ${decoded.email} (${decoded.userId})`);
        next();
      } catch (error) {
        console.log('[Socket] Authentication failed:', error instanceof Error ? error.message : 'Invalid token');
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

      const userRoom = `user:${socket.userId}`;
      
      // Join user-specific room
      socket.join(userRoom);
      
      // Track connection
      if (!this.connectedUsers.has(socket.userId)) {
        this.connectedUsers.set(socket.userId, new Set());
      }
      this.connectedUsers.get(socket.userId)!.add(socket.id);

      console.log(`[Socket] User connected: ${socket.email} joined room ${userRoom}`);

      // Send welcome message
      socket.emit('connected', {
        success: true,
        message: 'Connected to transfer notification service',
        data: {
          userId: socket.userId,
          room: userRoom,
          timestamp: new Date().toISOString()
        }
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong', {
          success: true,
          message: 'Connection healthy',
          data: {
            timestamp: new Date().toISOString(),
            userId: socket.userId
          }
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`[Socket] User disconnected: ${socket.email} (${reason})`);
        
        if (socket.userId && this.connectedUsers.has(socket.userId)) {
          const userSockets = this.connectedUsers.get(socket.userId)!;
          userSockets.delete(socket.id);
          
          if (userSockets.size === 0) {
            this.connectedUsers.delete(socket.userId);
            console.log(`[Socket] All connections closed for user: ${socket.userId}`);
          }
        }
      });
    });
  }

  /**
   * Emit transfer_pending event to user when transfer is created
   */
  emitTransferPending(userId: string, transactionData: any) {
    const userRoom = `user:${userId}`;
    
    console.log(`[Socket] Emitting transfer_pending to ${userRoom}:`, transactionData.id);
    
    this.io.to(userRoom).emit('transfer_pending', {
      success: true,
      message: 'Your transfer has been submitted and is awaiting approval',
      data: {
        transaction: transactionData,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Emit transfer_update event to user when transfer status changes
   */
  emitTransferUpdate(userId: string, transactionData: any) {
    const userRoom = `user:${userId}`;
    
    console.log(`[Socket] Emitting transfer_update to ${userRoom}:`, transactionData.id, transactionData.status);
    
    let message = 'Your transfer status has been updated';
    if (transactionData.status === 'COMPLETED') {
      message = 'Your transfer has been completed successfully! 🎉';
    } else if (transactionData.status === 'REJECTED') {
      message = 'Your transfer has been rejected';
    } else if (transactionData.status === 'PROCESSING') {
      message = 'Your transfer is being processed';
    } else if (transactionData.status === 'FAILED') {
      message = 'Your transfer failed to process';
    }

    this.io.to(userRoom).emit('transfer_update', {
      success: true,
      message,
      data: {
        transaction: transactionData,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Emit system-wide notification
   */
  emitSystemNotification(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    console.log(`[Socket] Broadcasting system notification (${level}): ${message}`);
    
    this.io.emit('system_notification', {
      success: true,
      message,
      data: {
        level,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const totalConnections = Array.from(this.connectedUsers.values())
      .reduce((sum, sockets) => sum + sockets.size, 0);

    return {
      connectedUsers: this.connectedUsers.size,
      totalConnections,
      rooms: Array.from(this.connectedUsers.keys()).map(userId => `user:${userId}`)
    };
  }

  /**
   * Close all connections
   */
  close() {
    console.log('[Socket] Closing all connections...');
    this.emitSystemNotification('Server is shutting down. Please reconnect in a moment.', 'warning');
    
    // Wait a bit for message delivery then close
    setTimeout(() => {
      this.io.close();
      this.connectedUsers.clear();
      console.log('[Socket] All connections closed');
    }, 1000);
  }
}

// Global socket service instance
let socketService: SocketService | null = null;

export function initializeSocket(httpServer: HttpServer): SocketService {
  if (socketService) {
    console.log('[Socket] Service already initialized');
    return socketService;
  }

  socketService = new SocketService(httpServer);
  console.log('[Socket] Service initialized successfully');
  return socketService;
}

export function getSocketService(): SocketService {
  if (!socketService) {
    throw new Error('Socket service not initialized. Call initializeSocket first.');
  }
  return socketService;
}