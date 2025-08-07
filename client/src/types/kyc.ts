// KYC Type Definitions for Frontend
// Matches backend API responses and request structures

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_ADDITIONAL_INFO';

export type DocumentType = 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID' | 'STATE_ID';

// User KYC submission data
export interface KycSubmissionData {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD format
  countryOfResidence: string; // ISO 3166-1 alpha-2 code
  residentialAddress: string;
  documentTypes: DocumentType[];
  documents: FileList | File[];
  selfie: FileList | File[];
  deviceFingerprint?: string;
}

// KYC status response from backend
export interface KycStatusResponse {
  success: boolean;
  data: {
    status: KycStatus;
    requestId?: string;
    submittedAt?: string;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
    canResubmit: boolean;
    canSubmit: boolean;
    documentsSubmitted?: number;
    lastUpdated?: string;
    submittedInfo?: {
      fullName: string;
      dateOfBirth: string;
      countryOfResidence: string;
    };
  };
}

// KYC submission response
export interface KycSubmissionResponse {
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    status: KycStatus;
    submittedAt: string;
    documentsUploaded: number;
    estimatedReviewTime: string;
  };
}

// Admin interfaces
export interface AdminKycRequest {
  id: string;
  userId: string;
  status: KycStatus;
  documents: string[];
  selfiePath: string | null;
  fullName: string;
  dateOfBirth: string;
  countryOfResidence: string;
  residentialAddress: string;
  documentTypes: DocumentType[];
  submissionIp: string | null;
  deviceFingerprint: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  riskScore: number;
  complianceFlags: Record<string, any>;
  submittedAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    country: string | null;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  // Additional calculated fields for admin view
  daysSinceSubmission?: number;
  riskIndicators?: {
    newAccount: boolean;
    highRiskCountry: boolean;
    suspiciousPattern: boolean;
  };
}

// Admin review data
export interface AdminKycReview {
  status: 'APPROVED' | 'REJECTED' | 'REQUIRES_ADDITIONAL_INFO';
  rejectionReason?: string;
  adminNotes?: string;
  riskScore?: number;
  complianceFlags?: Record<string, any>;
}

// Admin KYC statistics
export interface KycStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  avgProcessingTimeHours: number;
  performance: {
    approvalRate: string;
    rejectionRate: string;
    avgProcessingDays: string;
  };
  reportGenerated: string;
}

// Pagination interface
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Admin pending requests response
export interface AdminPendingRequestsResponse {
  success: boolean;
  data: {
    requests: AdminKycRequest[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    summary: {
      pendingCount: number;
      inReviewCount: number;
      requiresInfoCount: number;
      averageWaitTime: number;
    };
  };
}

// Country data for dropdown
export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag?: string;
}

// File validation constraints
export interface FileConstraints {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
  maxDocuments: number;
  maxSelfies: number;
}

// Form validation errors
export interface ValidationErrors {
  fullName?: string;
  dateOfBirth?: string;
  countryOfResidence?: string;
  residentialAddress?: string;
  documents?: string;
  selfie?: string;
  documentTypes?: string;
}

// API error response structure
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// Form submission state
export interface KycFormState {
  isSubmitting: boolean;
  errors: ValidationErrors;
  apiError: string | null;
  success: boolean;
}

// Upload progress tracking
export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Document preview interface
export interface DocumentPreview {
  file: File;
  preview: string; // Data URL for preview
  type: DocumentType;
  isValid: boolean;
  errors: string[];
}

// Selfie preview interface  
export interface SelfiePreview {
  file: File;
  preview: string;
  isValid: boolean;
  errors: string[];
}