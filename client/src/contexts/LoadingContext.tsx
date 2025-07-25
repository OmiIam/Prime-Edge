import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Loading } from '@/components/ui/loading';

interface LoadingContextType {
  isGlobalLoading: boolean;
  loadingMessage: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setLoadingMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessageState] = useState('Loading...');

  const showLoading = useCallback((message = 'Loading...') => {
    setLoadingMessageState(message);
    setIsGlobalLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsGlobalLoading(false);
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setLoadingMessageState(message);
  }, []);

  const value = {
    isGlobalLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    setLoadingMessage
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isGlobalLoading && (
        <Loading 
          variant="fullscreen" 
          message={loadingMessage}
        />
      )}
    </LoadingContext.Provider>
  );
}