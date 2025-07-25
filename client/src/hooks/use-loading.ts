import { useState, useCallback, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export function useLoading(initialState: boolean = false, initialMessage?: string) {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialState,
    message: initialMessage
  });

  const startLoading = useCallback((message?: string) => {
    setState({ isLoading: true, message });
  }, []);

  const stopLoading = useCallback(() => {
    setState({ isLoading: false, message: undefined });
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setState(prev => ({ ...prev, message }));
  }, []);

  return {
    isLoading: state.isLoading,
    message: state.message,
    startLoading,
    stopLoading,
    setLoadingMessage
  };
}

export function useAsyncLoading<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  deps: React.DependencyList = []
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<R | null>(null);

  const execute = useCallback(
    async (...args: T) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    deps
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    reset
  };
}

export function usePageLoading() {
  const [isPageLoading, setIsPageLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsPageLoading(true);
    const handleComplete = () => setIsPageLoading(false);

    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleComplete);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleComplete);
    };
  }, []);

  const startPageLoading = useCallback(() => setIsPageLoading(true), []);
  const stopPageLoading = useCallback(() => setIsPageLoading(false), []);

  return {
    isPageLoading,
    startPageLoading,
    stopPageLoading
  };
}