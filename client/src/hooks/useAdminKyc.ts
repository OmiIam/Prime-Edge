// Custom React Hooks for Admin KYC Operations
// Manages state and API interactions for admin KYC functionality

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import KycService, { KycApiError } from '../services/kycService';
import {
  AdminPendingRequestsResponse,
  AdminKycRequest,
  AdminKycReview,
  KycStatistics,
  KycStatus
} from '../types/kyc';

// Custom hook for managing admin KYC pending requests
export const useAdminKycRequests = (initialPage: number = 1, initialLimit: number = 10) => {
  const [requests, setRequests] = useState<AdminKycRequest[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: initialLimit,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [summary, setSummary] = useState({
    pendingCount: 0,
    inReviewCount: 0,
    requiresInfoCount: 0,
    averageWaitTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async (
    page: number = pagination.currentPage,
    limit: number = pagination.itemsPerPage,
    status?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await KycService.getPendingRequests(page, limit, status);
      
      setRequests(response.data.requests);
      setPagination(response.data.pagination);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Fetch pending requests error:', error);
      const errorMessage = error instanceof KycApiError 
        ? error.message 
        : 'Failed to fetch pending requests';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage]);

  // Change page
  const changePage = useCallback(async (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      await fetchPendingRequests(newPage, pagination.itemsPerPage, selectedStatus);
    }
  }, [fetchPendingRequests, pagination.totalPages, pagination.itemsPerPage, selectedStatus]);

  // Change page size
  const changePageSize = useCallback(async (newLimit: number) => {
    await fetchPendingRequests(1, newLimit, selectedStatus); // Reset to page 1 with new limit
  }, [fetchPendingRequests, selectedStatus]);

  // Filter by status
  const filterByStatus = useCallback(async (status: string) => {
    setSelectedStatus(status);
    await fetchPendingRequests(1, pagination.itemsPerPage, status); // Reset to page 1 with filter
  }, [fetchPendingRequests, pagination.itemsPerPage]);

  // Refresh requests
  const refreshRequests = useCallback(() => {
    return fetchPendingRequests(pagination.currentPage, pagination.itemsPerPage, selectedStatus);
  }, [fetchPendingRequests, pagination.currentPage, pagination.itemsPerPage, selectedStatus]);

  // Remove request from list after review
  const removeRequestFromList = useCallback((requestId: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    // Update summary counts
    setSummary(prev => ({
      ...prev,
      pendingCount: Math.max(0, prev.pendingCount - 1)
    }));
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  return {
    requests,
    pagination,
    summary,
    isLoading,
    error,
    selectedStatus,
    fetchPendingRequests,
    changePage,
    changePageSize,
    filterByStatus,
    refreshRequests,
    removeRequestFromList
  };
};

// Custom hook for managing individual KYC request details
export const useKycRequestDetails = (requestId: string | null) => {
  const [request, setRequest] = useState<AdminKycRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch request details
  const fetchRequestDetails = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await KycService.getKycRequestDetails(id);
      setRequest(response);
    } catch (error) {
      console.error('Fetch request details error:', error);
      const errorMessage = error instanceof KycApiError 
        ? error.message 
        : 'Failed to fetch request details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Download document for review
  const downloadDocument = useCallback(async (requestId: string, filename: string) => {
    try {
      const blob = await KycService.downloadAdminDocument(requestId, filename);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download document error:', error);
      const errorMessage = error instanceof KycApiError 
        ? error.message 
        : 'Failed to download document';
      toast.error(errorMessage);
    }
  }, []);

  // Preview document in new tab
  const previewDocument = useCallback(async (requestId: string, filename: string) => {
    try {
      const blob = await KycService.downloadAdminDocument(requestId, filename);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up URL after a delay to allow the window to load
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Preview document error:', error);
      const errorMessage = error instanceof KycApiError 
        ? error.message 
        : 'Failed to preview document';
      toast.error(errorMessage);
    }
  }, []);

  // Fetch details when requestId changes
  useEffect(() => {
    if (requestId) {
      fetchRequestDetails(requestId);
    } else {
      setRequest(null);
      setError(null);
    }
  }, [requestId, fetchRequestDetails]);

  return {
    request,
    isLoading,
    error,
    fetchRequestDetails,
    downloadDocument,
    previewDocument
  };
};

// Custom hook for KYC request review operations
export const useKycReview = () => {
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review single KYC request
  const reviewRequest = useCallback(async (
    requestId: string, 
    reviewData: AdminKycReview,
    onSuccess?: (requestId: string) => void
  ): Promise<boolean> => {
    try {
      setIsReviewing(true);
      setError(null);
      
      const response = await KycService.reviewKycRequest(requestId, reviewData);
      
      toast.success(response.message);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(requestId);
      }
      
      return true;
    } catch (error) {
      console.error('Review request error:', error);
      const errorMessage = error instanceof KycApiError 
        ? error.message 
        : 'Failed to review request';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsReviewing(false);
    }
  }, []);

  // Approve request
  const approveRequest = useCallback(async (
    requestId: string,
    adminNotes?: string,
    onSuccess?: (requestId: string) => void
  ): Promise<boolean> => {
    return reviewRequest(
      requestId,
      {
        status: 'APPROVED',
        adminNotes
      },
      onSuccess
    );
  }, [reviewRequest]);

  // Reject request
  const rejectRequest = useCallback(async (
    requestId: string,
    rejectionReason: string,
    adminNotes?: string,
    onSuccess?: (requestId: string) => void
  ): Promise<boolean> => {
    return reviewRequest(
      requestId,
      {
        status: 'REJECTED',
        rejectionReason,
        adminNotes
      },
      onSuccess
    );
  }, [reviewRequest]);

  // Request additional information
  const requestAdditionalInfo = useCallback(async (
    requestId: string,
    adminNotes: string,
    onSuccess?: (requestId: string) => void
  ): Promise<boolean> => {
    return reviewRequest(
      requestId,
      {
        status: 'REQUIRES_ADDITIONAL_INFO',
        adminNotes
      },
      onSuccess
    );
  }, [reviewRequest]);

  // Reset error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isReviewing,
    error,
    reviewRequest,
    approveRequest,
    rejectRequest,
    requestAdditionalInfo,
    clearError
  };
};

// Custom hook for bulk operations
export const useBulkKycOperations = () => {
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Perform bulk operations
  const bulkUpdateRequests = useCallback(async (
    requestIds: string[],
    action: 'APPROVE' | 'REJECT' | 'SET_IN_REVIEW',
    data?: { rejectionReason?: string; adminNotes?: string },
    onSuccess?: (processedIds: string[]) => void
  ): Promise<boolean> => {
    try {
      setIsBulkProcessing(true);
      setBulkError(null);
      
      if (requestIds.length === 0) {
        toast.error('No requests selected');
        return false;
      }

      if (requestIds.length > 50) {
        toast.error('Cannot process more than 50 requests at once');
        return false;
      }

      const response = await KycService.bulkUpdateRequests(requestIds, action, data);
      
      toast.success(response.message);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(requestIds);
      }
      
      return true;
    } catch (error) {
      console.error('Bulk update error:', error);
      const errorMessage = error instanceof KycApiError 
        ? error.message 
        : 'Failed to process bulk update';
      setBulkError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsBulkProcessing(false);
    }
  }, []);

  // Bulk approve
  const bulkApprove = useCallback(async (
    requestIds: string[],
    adminNotes?: string,
    onSuccess?: (processedIds: string[]) => void
  ): Promise<boolean> => {
    return bulkUpdateRequests(
      requestIds,
      'APPROVE',
      { adminNotes },
      onSuccess
    );
  }, [bulkUpdateRequests]);

  // Bulk reject
  const bulkReject = useCallback(async (
    requestIds: string[],
    rejectionReason: string,
    adminNotes?: string,
    onSuccess?: (processedIds: string[]) => void
  ): Promise<boolean> => {
    return bulkUpdateRequests(
      requestIds,
      'REJECT',
      { rejectionReason, adminNotes },
      onSuccess
    );
  }, [bulkUpdateRequests]);

  // Clear bulk error
  const clearBulkError = useCallback(() => {
    setBulkError(null);
  }, []);

  return {
    isBulkProcessing,
    bulkError,
    bulkUpdateRequests,
    bulkApprove,
    bulkReject,
    clearBulkError
  };
};

// Custom hook for KYC statistics
export const useKycStatistics = () => {
  const [statistics, setStatistics] = useState<KycStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch KYC statistics
  const fetchStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await KycService.getKycStatistics();
      setStatistics(response);
    } catch (error) {
      console.error('Fetch statistics error:', error);
      const errorMessage = error instanceof KycApiError 
        ? error.message 
        : 'Failed to fetch statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    isLoading,
    error,
    fetchStatistics
  };
};

// Main export combining all hooks for convenience
export const useAdminKyc = () => {
  return {
    useAdminKycRequests,
    useKycRequestDetails,
    useKycReview,
    useBulkKycOperations,
    useKycStatistics
  };
};