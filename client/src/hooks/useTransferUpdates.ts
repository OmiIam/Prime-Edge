import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface TransferUpdate {
  transferId: string;
  userId: string;
  status: 'approved' | 'rejected';
  amount: number;
  bankName: string;
  reason?: string;
  timestamp: string;
}

interface UseTransferUpdatesOptions {
  userId?: string;
  onTransferUpdate?: (update: TransferUpdate) => void;
  enableNotifications?: boolean;
}

export function useTransferUpdates(options: UseTransferUpdatesOptions = {}) {
  const { userId, onTransferUpdate, enableNotifications = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pollingInterval = useRef<NodeJS.Timeout>();
  const lastCheckTime = useRef<Date>(new Date());

  // Simple polling approach for real-time updates
  // In production, you'd use WebSockets or Server-Sent Events
  const checkForUpdates = async () => {
    if (!userId) return;

    try {
      // Fetch recent transactions to check for status changes
      const response = await fetch(`/api/user/transactions?limit=50&since=${lastCheckTime.current.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const transactions = data.transactions || [];

      // Look for external transfer status updates
      const updatedTransfers = transactions.filter((transaction: any) => 
        transaction.metadata?.transferType === 'external_bank' &&
        transaction.metadata?.requiresApproval &&
        (transaction.metadata?.approvedAt || transaction.metadata?.rejectedAt) &&
        new Date(transaction.updatedAt || transaction.createdAt) > lastCheckTime.current
      );

      if (updatedTransfers.length > 0) {
        // Invalidate relevant queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/pending-transfers'] });

        // Process each update
        updatedTransfers.forEach((transaction: any) => {
          const update: TransferUpdate = {
            transferId: transaction.id,
            userId: transaction.userId,
            status: transaction.metadata?.approvedAt ? 'approved' : 'rejected',
            amount: transaction.amount,
            bankName: transaction.metadata?.bankName || 'External Bank',
            reason: transaction.metadata?.reason,
            timestamp: transaction.metadata?.approvedAt || transaction.metadata?.rejectedAt
          };

          // Call custom callback if provided
          if (onTransferUpdate) {
            onTransferUpdate(update);
          }

          // Show toast notification
          if (enableNotifications) {
            const isApproved = update.status === 'approved';
            toast({
              title: isApproved ? "Transfer Approved! 🎉" : "Transfer Rejected",
              description: isApproved 
                ? `Your $${update.amount.toFixed(2)} transfer to ${update.bankName} has been approved and processed.`
                : `Your $${update.amount.toFixed(2)} transfer to ${update.bankName} was rejected. ${update.reason ? `Reason: ${update.reason}` : ''}`,
              variant: isApproved ? "default" : "destructive",
              duration: 8000, // Longer duration for important updates
            });
          }
        });

        lastCheckTime.current = new Date();
      }
    } catch (error) {
      console.error('Error checking for transfer updates:', error);
      // Don't show error toast for polling failures to avoid spam
    }
  };

  useEffect(() => {
    if (!userId) return;

    // Check immediately
    checkForUpdates();

    // Set up polling every 30 seconds
    pollingInterval.current = setInterval(checkForUpdates, 30000);

    // Cleanup on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [userId, enableNotifications]);

  // Provide manual refresh function
  const refreshTransfers = () => {
    checkForUpdates();
    queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/user/pending-transfers'] });
  };

  return {
    refreshTransfers
  };
}

// Alternative WebSocket-based implementation for production
export function useWebSocketTransferUpdates(options: UseTransferUpdatesOptions = {}) {
  const { userId, onTransferUpdate, enableNotifications = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // WebSocket connection for real-time updates
    // This would connect to your WebSocket server
    const connectWebSocket = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/transfers/${userId}`;
      
      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onmessage = (event) => {
          try {
            const update: TransferUpdate = JSON.parse(event.data);
            
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user/dashboard'] });

            // Handle update
            if (onTransferUpdate) {
              onTransferUpdate(update);
            }

            // Show notification
            if (enableNotifications) {
              const isApproved = update.status === 'approved';
              toast({
                title: isApproved ? "Transfer Approved! 🎉" : "Transfer Rejected",
                description: isApproved 
                  ? `Your $${update.amount.toFixed(2)} transfer to ${update.bankName} has been approved and processed.`
                  : `Your $${update.amount.toFixed(2)} transfer to ${update.bankName} was rejected. ${update.reason ? `Reason: ${update.reason}` : ''}`,
                variant: isApproved ? "default" : "destructive",
                duration: 8000,
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        // Fall back to polling
      }
    };

    // Only attempt WebSocket in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production') {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, enableNotifications]);

  const refreshTransfers = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/user/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/user/pending-transfers'] });
  };

  return {
    refreshTransfers
  };
}