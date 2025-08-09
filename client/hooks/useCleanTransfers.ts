import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Clean Transfer Hook for React
 * Provides Socket.IO real-time updates + polling fallback + optimistic updates
 */

export interface CleanTransfer {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  description: string | null;
  metadata: Record<string, any> | null;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferData {
  amount: number;
  currency?: string;
  recipientInfo: {
    name: string;
    accountNumber: string;
    bankCode: string;
  };
  description?: string;
}

export interface UseCleanTransfersOptions {
  enableSocketIO?: boolean;
  pollingInterval?: number;
  onTransferUpdate?: (transfer: CleanTransfer) => void;
}

export function useCleanTransfers(options: UseCleanTransfersOptions = {}) {
  const {
    enableSocketIO = true,
    pollingInterval = 30000, // 30 seconds
    onTransferUpdate
  } = options;

  const [transfers, setTransfers] = useState<CleanTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  /**
   * Initialize Socket.IO connection
   */
  const initializeSocket = () => {
    if (!enableSocketIO) return;

    const token = getAuthToken();
    if (!token) {
      console.warn('[Socket] No auth token found, skipping socket connection');
      return;
    }

    try {
      const socket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        console.log('[Socket] Connected successfully');
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.warn('[Socket] Connection error:', error.message);
        setIsConnected(false);
        setError('Real-time updates unavailable. Using polling fallback.');
      });

      // Listen for transfer events
      socket.on('transfer_pending', (response) => {
        console.log('[Socket] Transfer pending received:', response);
        
        if (response.success && response.data?.transaction) {
          const transaction = response.data.transaction;
          
          // Add to transfers list (optimistic update)
          setTransfers(prev => {
            const exists = prev.find(t => t.id === transaction.id);
            if (exists) return prev;
            return [transaction, ...prev];
          });

          // Call custom callback
          if (onTransferUpdate) {
            onTransferUpdate(transaction);
          }
        }
      });

      socket.on('transfer_update', (response) => {
        console.log('[Socket] Transfer update received:', response);
        
        if (response.success && response.data?.transaction) {
          const transaction = response.data.transaction;
          
          // Update existing transfer
          setTransfers(prev => 
            prev.map(t => t.id === transaction.id ? transaction : t)
          );

          // Call custom callback
          if (onTransferUpdate) {
            onTransferUpdate(transaction);
          }
        }
      });

      socket.on('system_notification', (response) => {
        console.log('[Socket] System notification:', response);
        
        if (response.data?.level === 'error' || response.data?.level === 'warning') {
          setError(response.message);
        }
      });

      socketRef.current = socket;

    } catch (socketError) {
      console.error('[Socket] Failed to initialize:', socketError);
      setError('Failed to initialize real-time updates');
    }
  };

  /**
   * Polling fallback for transfer updates
   */
  const pollTransferUpdates = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/user/transfer-updates?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication expired. Please log in again.');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.transfers) {
        setTransfers(data.data.transfers);
        setError(null);
      }
    } catch (pollError) {
      console.warn('[Polling] Failed to fetch updates:', pollError);
      setError('Failed to fetch transfer updates');
    }
  };

  /**
   * Create a new transfer
   */
  const createTransfer = async (transferData: CreateTransferData): Promise<CleanTransfer> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch('/api/user/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transferData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Transfer creation failed');
      }

      const transaction = data.data.transaction;

      // Optimistic update if socket is not connected
      if (!isConnected) {
        setTransfers(prev => [transaction, ...prev]);
      }

      return transaction;

    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create transfer';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manually refresh transfers
   */
  const refreshTransfers = async () => {
    await pollTransferUpdates();
  };

  // Initialize on mount
  useEffect(() => {
    // Initialize socket connection
    initializeSocket();

    // Start polling fallback
    pollTransferUpdates();
    
    if (pollingInterval > 0) {
      pollingIntervalRef.current = setInterval(pollTransferUpdates, pollingInterval);
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enableSocketIO, pollingInterval]);

  return {
    transfers,
    isLoading,
    error,
    isConnected,
    createTransfer,
    refreshTransfers
  };
}

/**
 * Example usage component
 */
export function TransferExample() {
  const { 
    transfers, 
    isLoading, 
    error, 
    isConnected, 
    createTransfer 
  } = useCleanTransfers({
    enableSocketIO: true,
    pollingInterval: 30000,
    onTransferUpdate: (transfer) => {
      console.log('Transfer updated:', transfer.id, transfer.status);
      
      // Show notification based on status
      if (transfer.status === 'COMPLETED') {
        alert(`Transfer completed! Amount: ${transfer.amount} ${transfer.currency}`);
      } else if (transfer.status === 'REJECTED') {
        alert(`Transfer rejected: ${transfer.id}`);
      }
    }
  });

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    recipientName: '',
    accountNumber: '',
    bankCode: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.recipientName || !formData.accountNumber || !formData.bankCode) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const transfer = await createTransfer({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        recipientInfo: {
          name: formData.recipientName,
          accountNumber: formData.accountNumber,
          bankCode: formData.bankCode
        },
        description: formData.description || undefined
      });

      console.log('Transfer created:', transfer);
      
      // Reset form
      setFormData({
        amount: '',
        currency: 'USD',
        recipientName: '',
        accountNumber: '',
        bankCode: '',
        description: ''
      });

      alert('Transfer submitted successfully and is awaiting approval!');

    } catch (error) {
      console.error('Transfer creation failed:', error);
      alert(`Failed to create transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Connection Status */}
      <div className={`p-3 rounded-lg text-sm font-medium ${
        isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      }`}>
        {isConnected ? '🟢 Real-time updates active' : '🟡 Using polling fallback'}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 text-red-800 border border-red-200 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Transfer Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Create Transfer</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recipient Name *</label>
          <input
            type="text"
            value={formData.recipientName}
            onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Account Number *</label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Bank Code *</label>
            <input
              type="text"
              value={formData.bankCode}
              onChange={(e) => setFormData(prev => ({ ...prev, bankCode: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Transfer...' : 'Create Transfer'}
        </button>
      </form>

      {/* Transfer List */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Your Transfers</h3>
        </div>
        
        <div className="divide-y">
          {transfers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transfers found
            </div>
          ) : (
            transfers.map((transfer) => (
              <div key={transfer.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {transfer.amount} {transfer.currency}
                    </div>
                    <div className="text-sm text-gray-600">
                      {transfer.description || 'External Transfer'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transfer.createdAt).toLocaleString()}
                    </div>
                    {transfer.reference && (
                      <div className="text-xs text-gray-500">
                        Ref: {transfer.reference}
                      </div>
                    )}
                  </div>
                  
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    transfer.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    transfer.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    transfer.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                    transfer.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transfer.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}