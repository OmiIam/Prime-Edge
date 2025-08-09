import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

interface CleanTransfer {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  description: string | null;
  reference: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateTransferRequest {
  amount: number;
  currency?: string;
  recipient: {
    name: string;
    accountNumber: string;
    bankCode: string;
  };
  metadata?: Record<string, any>;
}

interface UseCleanTransfersOptions {
  enableRealtime?: boolean;
  pollingInterval?: number;
}

export function useCleanTransfers(options: UseCleanTransfersOptions = {}) {
  const { enableRealtime = true, pollingInterval = 30000 } = options;
  const [transfers, setTransfers] = useState<CleanTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enableRealtime) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const socket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Connected to transfer updates service');
      });

      socket.on('transfer_pending', (data) => {
        console.log('Transfer pending received:', data);
        
        if (data.transaction) {
          // Add to local state optimistically
          setTransfers(prev => [data.transaction, ...prev]);
          
          toast({
            title: 'Transfer Submitted',
            description: data.message || 'Your transfer is awaiting approval',
            duration: 5000,
          });
        }

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
      });

      socket.on('transfer_update', (data) => {
        console.log('Transfer update received:', data);
        
        if (data.transaction) {
          // Update local state
          setTransfers(prev => 
            prev.map(transfer => 
              transfer.id === data.transaction.id ? data.transaction : transfer
            )
          );

          const isSuccess = data.transaction.status === 'COMPLETED';
          const isRejected = data.transaction.status === 'REJECTED';
          
          toast({
            title: isSuccess ? 'Transfer Completed! 🎉' : 
                   isRejected ? 'Transfer Rejected' : 'Transfer Updated',
            description: data.message,
            variant: isRejected ? 'destructive' : 'default',
            duration: 8000,
          });
        }

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
      });

      socket.on('connect_error', (error) => {
        console.warn('Socket connection error:', error.message);
        setError('Real-time updates unavailable. Using polling fallback.');
      });

      socketRef.current = socket;

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (socketError) {
      console.warn('Failed to initialize socket:', socketError);
      setError('Real-time updates unavailable. Using polling fallback.');
    }
  }, [enableRealtime, toast, queryClient]);

  // Polling fallback
  useEffect(() => {
    if (enableRealtime && socketRef.current?.connected) {
      // Skip polling if socket is connected
      return;
    }

    const pollTransfers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/user/transfer-updates?limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data.updates) {
          setTransfers(data.data.updates);
          setError(null);
        }
      } catch (pollError) {
        console.warn('Polling failed:', pollError);
        setError('Failed to fetch transfer updates');
      }
    };

    // Poll immediately then set interval
    pollTransfers();
    pollingRef.current = setInterval(pollTransfers, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enableRealtime, pollingInterval]);

  // Create transfer function
  const createTransfer = async (request: CreateTransferRequest): Promise<CleanTransfer> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/user/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Transfer creation failed');
      }

      const transfer = data.data.transaction;

      // Optimistically update local state if socket didn't emit
      if (!enableRealtime || !socketRef.current?.connected) {
        setTransfers(prev => [transfer, ...prev]);
      }

      // Show success toast
      toast({
        title: 'Transfer Submitted',
        description: 'Your transfer has been submitted for approval',
        duration: 5000,
      });

      return transfer;
    } catch (createError) {
      const errorMessage = createError instanceof Error ? createError.message : 'Failed to create transfer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh transfers manually
  const refreshTransfers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/transfer-updates?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.updates) {
          setTransfers(data.data.updates);
          setError(null);
        }
      }
    } catch (refreshError) {
      console.warn('Manual refresh failed:', refreshError);
    }
  };

  return {
    transfers,
    isLoading,
    error,
    createTransfer,
    refreshTransfers,
    isConnected: socketRef.current?.connected || false,
  };
}

// Example usage component
export function TransferExample() {
  const { transfers, isLoading, error, createTransfer, isConnected } = useCleanTransfers();
  const [formData, setFormData] = useState({
    amount: '',
    recipientName: '',
    accountNumber: '',
    bankCode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTransfer({
        amount: parseFloat(formData.amount),
        recipient: {
          name: formData.recipientName,
          accountNumber: formData.accountNumber,
          bankCode: formData.bankCode,
        },
      });

      // Reset form on success
      setFormData({
        amount: '',
        recipientName: '',
        accountNumber: '',
        bankCode: '',
      });
    } catch (error) {
      console.error('Transfer creation failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <div className={`text-sm px-3 py-2 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {isConnected ? '🟢 Real-time updates active' : '🟡 Using polling fallback'}
      </div>

      {/* Transfer form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Recipient Name"
          value={formData.recipientName}
          onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Account Number (10 digits)"
          value={formData.accountNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
          required
          pattern="\\d{10}"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Bank Code (3 digits)"
          value={formData.bankCode}
          onChange={(e) => setFormData(prev => ({ ...prev, bankCode: e.target.value }))}
          required
          pattern="\\d{3}"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {isLoading ? 'Creating Transfer...' : 'Create Transfer'}
        </button>
      </form>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      {/* Transfer list */}
      <div className="space-y-2">
        <h3 className="font-semibold">Your Transfers</h3>
        {transfers.length === 0 ? (
          <p className="text-gray-500">No transfers found</p>
        ) : (
          transfers.map((transfer) => (
            <div
              key={transfer.id}
              className={`p-3 rounded border ${
                transfer.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
                transfer.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
                transfer.status === 'PROCESSING' ? 'bg-blue-50 border-blue-200' :
                'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{transfer.currency} {transfer.amount}</p>
                  <p className="text-sm text-gray-600">{transfer.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(transfer.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded font-medium ${
                    transfer.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                    transfer.status === 'REJECTED' ? 'bg-red-200 text-red-800' :
                    transfer.status === 'PROCESSING' ? 'bg-blue-200 text-blue-800' :
                    'bg-yellow-200 text-yellow-800'
                  }`}
                >
                  {transfer.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}