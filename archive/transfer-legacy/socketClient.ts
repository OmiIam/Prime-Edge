/**
 * Frontend Socket.IO client for real-time transfer updates
 * This provides a clean interface for the frontend to connect to the WebSocket server
 */

import { io, Socket } from 'socket.io-client';

interface TransferUpdate {
  transaction: any;
  status: 'approved' | 'rejected';
  reason?: string;
  message: string;
  timestamp: string;
}

interface TransferPending {
  transaction: any;
  message: string;
  timestamp: string;
}

export class SocketClient {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    // Initialize event listener sets
    this.eventListeners.set('connected', new Set());
    this.eventListeners.set('transfer_pending', new Set());
    this.eventListeners.set('transfer_update', new Set());
    this.eventListeners.set('transfer_updates', new Set());
    this.eventListeners.set('error', new Set());
    this.eventListeners.set('disconnect', new Set());
  }

  /**
   * Connect to the WebSocket server
   */
  public async connect(token: string): Promise<boolean> {
    if (this.socket?.connected) {
      console.log('⚡ Socket already connected');
      return true;
    }

    if (this.isConnecting) {
      console.log('⚡ Socket connection already in progress');
      return false;
    }

    this.isConnecting = true;

    try {
      const serverUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5173';

      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        retries: 3
      });

      // Setup event handlers
      this.setupEventHandlers();

      // Wait for connection
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️  Socket connection timeout');
          this.isConnecting = false;
          resolve(false);
        }, 10000);

        this.socket!.on('connect', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.log('✅ Socket connected successfully');
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error('❌ Socket connection error:', error.message);
          resolve(false);
        });
      });

    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to create socket connection:', error);
      return false;
    }
  }

  /**
   * Setup event handlers for the socket
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connected', (data) => {
      console.log('🔌 Connected to transfer updates:', data);
      this.emitToListeners('connected', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.emitToListeners('disconnect', reason);
    });

    // Transfer events
    this.socket.on('transfer_pending', (data: TransferPending) => {
      console.log('🚀 Transfer pending:', data);
      this.emitToListeners('transfer_pending', data);
    });

    this.socket.on('transfer_update', (data: TransferUpdate) => {
      console.log('📣 Transfer update:', data);
      this.emitToListeners('transfer_update', data);
    });

    this.socket.on('transfer_updates', (data) => {
      console.log('📡 Transfer updates:', data);
      this.emitToListeners('transfer_updates', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.emitToListeners('error', error);
    });

    // Pong response for connection health
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });
  }

  /**
   * Emit events to registered listeners
   */
  private emitToListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Add event listener
   */
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Request transfer updates manually
   */
  public requestTransferUpdates(): void {
    if (this.socket?.connected) {
      this.socket.emit('request_transfer_updates');
      console.log('📡 Requested transfer updates');
    } else {
      console.warn('⚠️  Cannot request transfer updates - socket not connected');
    }
  }

  /**
   * Send ping to server to check connection health
   */
  public ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
      console.log('🏓 Ping sent');
    }
  }

  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection ID
   */
  public getConnectionId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Cleanup and destroy the socket client
   */
  public destroy(): void {
    this.disconnect();
    this.eventListeners.clear();
  }
}

// Create singleton instance
export const socketClient = new SocketClient();

// Auto-connect when auth token is available
export const initializeSocketConnection = async (token: string): Promise<boolean> => {
  if (!token) {
    console.warn('⚠️  No auth token provided for socket connection');
    return false;
  }

  try {
    const connected = await socketClient.connect(token);
    if (connected) {
      console.log('✅ Socket client initialized successfully');
      return true;
    } else {
      console.warn('⚠️  Socket client failed to connect');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing socket client:', error);
    return false;
  }
};

export default socketClient;