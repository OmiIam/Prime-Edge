/**
 * Frontend Socket.IO Client Example
 * Demonstrates how to connect to the transfer system's WebSocket events
 */

import { io, Socket } from 'socket.io-client';

// Event interfaces for type safety
interface TransferPendingEvent {
  transaction: {
    id: string;
    amount: number;
    status: string;
    description: string;
    metadata: any;
  };
  message: string;
  timestamp: string;
  type: 'transfer_pending';
}

interface TransferUpdateEvent {
  transaction: {
    id: string;
    amount: number;
    status: string;
    description: string;
    metadata: any;
  };
  status: 'approved' | 'rejected';
  reason?: string;
  message: string;
  timestamp: string;
  type: 'transfer_update';
}

interface TransferUpdatesEvent {
  updates: any[];
  count: number;
  timestamp: string;
}

/**
 * Transfer Socket Client
 * Handles WebSocket connection and transfer-related events
 */
export class TransferSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.initializeEventMaps();
  }

  /**
   * Initialize event listener maps
   */
  private initializeEventMaps(): void {
    const events = [
      'connected',
      'transfer_pending', 
      'transfer_update', 
      'transfer_updates',
      'system_notification',
      'error',
      'disconnect'
    ];
    
    events.forEach(event => {
      this.listeners.set(event, new Set());
    });
  }

  /**
   * Connect to the WebSocket server with authentication
   */
  public async connect(authToken: string): Promise<boolean> {
    if (this.socket?.connected) {
      console.log('⚡ Already connected to transfer notifications');
      return true;
    }

    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
      
      this.socket = io(serverUrl, {
        auth: { token: authToken },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        retries: 3
      });

      // Setup event handlers
      this.setupEventHandlers();

      // Wait for successful connection
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️ Socket connection timeout');
          resolve(false);
        }, 10000);

        this.socket!.on('connected', (data) => {
          clearTimeout(timeout);
          console.log('✅ Connected to transfer notifications:', data);
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Socket connection error:', error.message);
          resolve(false);
        });
      });

    } catch (error) {
      console.error('❌ Failed to initialize socket connection:', error);
      return false;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connected', (data) => {
      console.log('🔌 Transfer notifications connected:', data);
      this.emitToListeners('connected', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Transfer notifications disconnected:', reason);
      this.emitToListeners('disconnect', reason);
    });

    // Transfer events
    this.socket.on('transfer_pending', (data: TransferPendingEvent) => {
      console.log('🚀 Transfer pending:', data);
      this.emitToListeners('transfer_pending', data);
      
      // You can add custom UI logic here, such as:
      // - Show notification toast
      // - Update pending transfers list
      // - Play notification sound
      this.showNotification('Transfer Submitted', data.message, 'info');
    });

    this.socket.on('transfer_update', (data: TransferUpdateEvent) => {
      console.log('📣 Transfer status update:', data);
      this.emitToListeners('transfer_update', data);
      
      // Custom UI logic for status updates
      const isApproved = data.status === 'approved';
      this.showNotification(
        isApproved ? '✅ Transfer Approved' : '❌ Transfer Rejected',
        data.message,
        isApproved ? 'success' : 'error'
      );
      
      // Update UI state
      this.updateTransferInUI(data.transaction);
    });

    this.socket.on('transfer_updates', (data: TransferUpdatesEvent) => {
      console.log('📡 Bulk transfer updates:', data);
      this.emitToListeners('transfer_updates', data);
    });

    this.socket.on('system_notification', (data) => {
      console.log('📢 System notification:', data);
      this.emitToListeners('system_notification', data);
      this.showNotification('System Notice', data.message, 'info');
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.emitToListeners('error', error);
    });

    // Heartbeat/ping handling
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });
  }

  /**
   * Add event listener for specific events
   */
  public on(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback);
    } else {
      console.warn(`Unknown event type: ${event}`);
    }
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
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
      console.log('📡 Requested transfer updates via WebSocket');
    } else {
      console.warn('⚠️ Cannot request updates - not connected');
    }
  }

  /**
   * Send heartbeat ping
   */
  public ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
      console.log('🏓 Heartbeat ping sent');
    }
  }

  /**
   * Check connection status
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
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from transfer notifications...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.disconnect();
    this.listeners.clear();
  }

  /**
   * Emit events to registered listeners
   */
  private emitToListeners(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Show notification to user (integrate with your notification system)
   */
  private showNotification(title: string, message: string, type: 'info' | 'success' | 'error'): void {
    // Example implementation - replace with your actual notification system
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: type === 'success' ? '/icons/success.png' : 
              type === 'error' ? '/icons/error.png' : '/icons/info.png'
      });
    }

    // Also trigger custom UI notifications
    const customEvent = new CustomEvent('transfer-notification', {
      detail: { title, message, type }
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * Update transfer in UI (integrate with your state management)
   */
  private updateTransferInUI(transaction: any): void {
    // Example implementation - replace with your actual state management
    const updateEvent = new CustomEvent('transfer-status-changed', {
      detail: { transaction }
    });
    window.dispatchEvent(updateEvent);
  }
}

/**
 * React Hook Example for Transfer Notifications
 */
export function useTransferNotifications(authToken: string) {
  const [client] = useState(() => new TransferSocketClient());
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<TransferUpdateEvent | null>(null);

  useEffect(() => {
    if (!authToken) return;

    // Connect to WebSocket
    client.connect(authToken).then(connected => {
      setIsConnected(connected);
    });

    // Setup event listeners
    const handleTransferUpdate = (data: TransferUpdateEvent) => {
      setLastUpdate(data);
      
      // Optional: Show toast notification
      // toast.success(data.message);
    };

    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
    };

    client.on('transfer_update', handleTransferUpdate);
    client.on('connected', () => handleConnectionChange(true));
    client.on('disconnect', () => handleConnectionChange(false));

    // Cleanup on unmount
    return () => {
      client.off('transfer_update', handleTransferUpdate);
      client.destroy();
    };
  }, [authToken, client]);

  return {
    isConnected,
    lastUpdate,
    requestUpdates: () => client.requestTransferUpdates(),
    ping: () => client.ping()
  };
}

// Export singleton instance
export const transferSocketClient = new TransferSocketClient();