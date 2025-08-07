// KYC API Service Layer
// Handles all API communication with the Express backend

import { authManager } from '../lib/auth';
import {
  KycSubmissionData,
  KycStatusResponse,
  KycSubmissionResponse,
  AdminPendingRequestsResponse,
  AdminKycRequest,
  AdminKycReview,
  KycStatistics,
  ApiErrorResponse
} from '../types/kyc';

// Base API configuration
const API_BASE = '/api';
const KYC_ENDPOINT = `${API_BASE}/kyc`;
const ADMIN_KYC_ENDPOINT = `${API_BASE}/admin/kyc`;

// API response wrapper for type safety
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

class KycApiError extends Error {
  public errors?: Array<{ field: string; message: string; value?: any }>;
  public statusCode?: number;

  constructor(message: string, errors?: Array<{ field: string; message: string; value?: any }>, statusCode?: number) {
    super(message);
    this.name = 'KycApiError';
    this.errors = errors;
    this.statusCode = statusCode;
  }
}

// Utility to create authenticated fetch requests
const createAuthenticatedRequest = (url: string, options: RequestInit = {}): Promise<Response> => {
  const authHeaders = authManager.getAuthHeader();
  
  const defaultOptions: RequestInit = {
    headers: {
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  };

  return fetch(url, defaultOptions);
};

// Utility to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  let data: ApiResponse<T> | ApiErrorResponse;
  
  try {
    data = await response.json();
  } catch (error) {
    throw new KycApiError(
      `Failed to parse response: ${response.statusText}`,
      undefined,
      response.status
    );
  }

  if (!response.ok) {
    throw new KycApiError(
      data.message || `HTTP ${response.status}: ${response.statusText}`,
      'errors' in data ? data.errors : undefined,
      response.status
    );
  }

  if (!data.success) {
    throw new KycApiError(
      data.message || 'API request failed',
      'errors' in data ? data.errors : undefined,
      response.status
    );
  }

  return data as T;
};

export class KycService {
  
  // ==== USER KYC OPERATIONS ====

  /**
   * Submit KYC verification documents and information
   * POST /api/kyc/submit
   */
  static async submitKyc(submissionData: KycSubmissionData): Promise<KycSubmissionResponse> {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('fullName', submissionData.fullName);
      formData.append('dateOfBirth', submissionData.dateOfBirth);
      formData.append('countryOfResidence', submissionData.countryOfResidence);
      formData.append('residentialAddress', submissionData.residentialAddress);
      formData.append('documentTypes', JSON.stringify(submissionData.documentTypes));
      
      if (submissionData.deviceFingerprint) {
        formData.append('deviceFingerprint', submissionData.deviceFingerprint);
      }

      // Add document files
      const documents = Array.from(submissionData.documents);
      documents.forEach((file) => {
        formData.append('documents', file);
      });

      // Add selfie file
      const selfies = Array.from(submissionData.selfie);
      if (selfies.length > 0) {
        formData.append('selfie', selfies[0]);
      }

      const response = await createAuthenticatedRequest(`${KYC_ENDPOINT}/submit`, {
        method: 'POST',
        body: formData, // Don't set Content-Type header - let browser set it with boundary
      });

      return await handleApiResponse<KycSubmissionResponse>(response);

    } catch (error) {
      console.error('KYC submission error:', error);
      throw error;
    }
  }

  /**
   * Get user's current KYC status
   * GET /api/kyc/status
   */
  static async getKycStatus(): Promise<KycStatusResponse> {
    try {
      const response = await createAuthenticatedRequest(`${KYC_ENDPOINT}/status`);
      return await handleApiResponse<KycStatusResponse>(response);
    } catch (error) {
      console.error('Get KYC status error:', error);
      throw error;
    }
  }

  /**
   * Download user's own KYC document
   * GET /api/kyc/document/:filename
   */
  static async downloadDocument(filename: string): Promise<Blob> {
    try {
      const response = await createAuthenticatedRequest(`${KYC_ENDPOINT}/document/${filename}`);
      
      if (!response.ok) {
        throw new KycApiError(`Failed to download document: ${response.statusText}`, undefined, response.status);
      }

      return await response.blob();
    } catch (error) {
      console.error('Download document error:', error);
      throw error;
    }
  }

  /**
   * Delete user's KYC data (GDPR right to be forgotten)
   * DELETE /api/kyc/data
   */
  static async deleteKycData(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await createAuthenticatedRequest(`${KYC_ENDPOINT}/data`, {
        method: 'DELETE'
      });

      return await handleApiResponse<{ success: boolean; message: string }>(response);
    } catch (error) {
      console.error('Delete KYC data error:', error);
      throw error;
    }
  }

  /**
   * Resubmit KYC after rejection
   * POST /api/kyc/resubmit
   */
  static async resubmitKyc(submissionData: KycSubmissionData): Promise<KycSubmissionResponse> {
    try {
      // Create FormData for multipart upload  
      const formData = new FormData();
      
      // Add text fields
      formData.append('fullName', submissionData.fullName);
      formData.append('dateOfBirth', submissionData.dateOfBirth);
      formData.append('countryOfResidence', submissionData.countryOfResidence);
      formData.append('residentialAddress', submissionData.residentialAddress);
      formData.append('documentTypes', JSON.stringify(submissionData.documentTypes));
      
      if (submissionData.deviceFingerprint) {
        formData.append('deviceFingerprint', submissionData.deviceFingerprint);
      }

      // Add document files
      const documents = Array.from(submissionData.documents);
      documents.forEach((file) => {
        formData.append('documents', file);
      });

      // Add selfie file
      const selfies = Array.from(submissionData.selfie);
      if (selfies.length > 0) {
        formData.append('selfie', selfies[0]);
      }

      const response = await createAuthenticatedRequest(`${KYC_ENDPOINT}/resubmit`, {
        method: 'POST',
        body: formData,
      });

      return await handleApiResponse<KycSubmissionResponse>(response);

    } catch (error) {
      console.error('KYC resubmission error:', error);
      throw error;
    }
  }

  // ==== ADMIN KYC OPERATIONS ====

  /**
   * Get all pending KYC requests for admin review
   * GET /api/admin/kyc/pending
   */
  static async getPendingRequests(
    page: number = 1, 
    limit: number = 10, 
    status?: string
  ): Promise<AdminPendingRequestsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (status) {
        params.append('status', status);
      }

      const response = await createAuthenticatedRequest(`${ADMIN_KYC_ENDPOINT}/pending?${params}`);
      return await handleApiResponse<AdminPendingRequestsResponse>(response);
    } catch (error) {
      console.error('Get pending requests error:', error);
      throw error;
    }
  }

  /**
   * Get detailed view of specific KYC request
   * GET /api/admin/kyc/:requestId
   */
  static async getKycRequestDetails(requestId: string): Promise<AdminKycRequest> {
    try {
      const response = await createAuthenticatedRequest(`${ADMIN_KYC_ENDPOINT}/${requestId}`);
      const result = await handleApiResponse<{ success: boolean; data: AdminKycRequest }>(response);
      return result.data!;
    } catch (error) {
      console.error('Get request details error:', error);
      throw error;
    }
  }

  /**
   * Download KYC document for admin review
   * GET /api/admin/kyc/:requestId/document/:filename
   */
  static async downloadAdminDocument(requestId: string, filename: string): Promise<Blob> {
    try {
      const response = await createAuthenticatedRequest(`${ADMIN_KYC_ENDPOINT}/${requestId}/document/${filename}`);
      
      if (!response.ok) {
        throw new KycApiError(`Failed to download document: ${response.statusText}`, undefined, response.status);
      }

      return await response.blob();
    } catch (error) {
      console.error('Download admin document error:', error);
      throw error;
    }
  }

  /**
   * Review KYC request (approve/reject)
   * PUT /api/admin/kyc/:requestId/review
   */
  static async reviewKycRequest(
    requestId: string, 
    reviewData: AdminKycReview
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await createAuthenticatedRequest(`${ADMIN_KYC_ENDPOINT}/${requestId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      return await handleApiResponse<{ success: boolean; message: string; data: any }>(response);
    } catch (error) {
      console.error('Review KYC request error:', error);
      throw error;
    }
  }

  /**
   * Bulk update KYC requests
   * POST /api/admin/kyc/bulk-update
   */
  static async bulkUpdateRequests(
    requestIds: string[], 
    action: 'APPROVE' | 'REJECT' | 'SET_IN_REVIEW',
    data?: { rejectionReason?: string; adminNotes?: string }
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await createAuthenticatedRequest(`${ADMIN_KYC_ENDPOINT}/bulk-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestIds,
          action,
          data
        }),
      });

      return await handleApiResponse<{ success: boolean; message: string; data: any }>(response);
    } catch (error) {
      console.error('Bulk update requests error:', error);
      throw error;
    }
  }

  /**
   * Get KYC statistics for admin dashboard
   * GET /api/admin/kyc/statistics
   */
  static async getKycStatistics(): Promise<KycStatistics> {
    try {
      const response = await createAuthenticatedRequest(`${ADMIN_KYC_ENDPOINT}/statistics`);
      const result = await handleApiResponse<{ success: boolean; data: KycStatistics }>(response);
      return result.data!;
    } catch (error) {
      console.error('Get KYC statistics error:', error);
      throw error;
    }
  }
}

// Export error class for component usage
export { KycApiError };

// Export service as default
export default KycService;