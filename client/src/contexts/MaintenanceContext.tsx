import React, { createContext, useContext, useEffect } from 'react';
import { useMaintenance } from '@/hooks/useMaintenance';
import MaintenancePage from '@/pages/maintenance';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  checkMaintenanceStatus: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

/**
 * Provider that wraps the entire app and handles maintenance mode
 */
export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const maintenanceState = useMaintenance();

  // If maintenance mode is active, show maintenance page
  if (maintenanceState.isMaintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <MaintenanceContext.Provider value={maintenanceState}>
      {children}
    </MaintenanceContext.Provider>
  );
}

/**
 * Hook to use the maintenance context
 */
export function useMaintenanceContext(): MaintenanceContextType {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenanceContext must be used within a MaintenanceProvider');
  }
  return context;
}