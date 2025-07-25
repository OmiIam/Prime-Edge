import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLoadingContext } from '@/contexts/LoadingContext';

export function RouteLoader() {
  const [location] = useLocation();
  const [previousLocation, setPreviousLocation] = useState(location);
  const { showLoading, hideLoading } = useLoadingContext();

  useEffect(() => {
    if (location !== previousLocation) {
      showLoading('Loading page...');
      
      const timer = setTimeout(() => {
        hideLoading();
        setPreviousLocation(location);
      }, 800);

      return () => {
        clearTimeout(timer);
        hideLoading();
      };
    }
  }, [location, previousLocation, showLoading, hideLoading]);

  return null;
}