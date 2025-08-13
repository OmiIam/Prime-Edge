import { useState, useEffect } from 'react';

interface MaintenanceStatus {
  maintenance: boolean;
  message: string;
  timestamp: string;
}

interface UseMaintenanceReturn {
  isMaintenanceMode: boolean;
  maintenanceInfo: MaintenanceStatus | null;
  checkMaintenanceStatus: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage maintenance mode state
 */
export function useMaintenance(): UseMaintenanceReturn {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check environment variable first
  const envMaintenanceMode = import.meta.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' || 
                            import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  const checkMaintenanceStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/maintenance/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error('Failed to check maintenance status');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setMaintenanceInfo(data.data);
        setIsMaintenanceMode(data.data.maintenance || envMaintenanceMode);
      } else {
        setIsMaintenanceMode(envMaintenanceMode);
      }
    } catch (err) {
      console.error('Error checking maintenance status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback to environment variable if API fails
      setIsMaintenanceMode(envMaintenanceMode);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkMaintenanceStatus();

    // Set up polling to check maintenance status periodically
    const interval = setInterval(checkMaintenanceStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Also check environment variable on initial load
  useEffect(() => {
    if (envMaintenanceMode) {
      setIsMaintenanceMode(true);
    }
  }, [envMaintenanceMode]);

  return {
    isMaintenanceMode,
    maintenanceInfo,
    checkMaintenanceStatus,
    loading,
    error
  };
}

/**
 * Simple hook to check if maintenance mode is enabled
 * (for components that just need a boolean check)
 */
export function useIsMaintenanceMode(): boolean {
  const { isMaintenanceMode } = useMaintenance();
  return isMaintenanceMode;
}