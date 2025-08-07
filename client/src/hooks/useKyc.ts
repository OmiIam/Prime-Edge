// Custom React Hooks for KYC Operations
// Manages state and API interactions for user KYC functionality

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import KycService, { KycApiError } from '../services/kycService';
import {
  KycSubmissionData,
  KycStatusResponse,
  KycSubmissionResponse,
  KycFormState,
  ValidationErrors,
  DocumentPreview,
  SelfiePreview,
  UploadProgress,
  FileConstraints
} from '../types/kyc';

// File upload constraints
const FILE_CONSTRAINTS: FileConstraints = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
  maxDocuments: 3,
  maxSelfies: 1
};

// Custom hook for KYC submission
export const useKycSubmission = () => {
  const [formState, setFormState] = useState<KycFormState>({
    isSubmitting: false,
    errors: {},
    apiError: null,
    success: false
  });

  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  // Validate individual file
  const validateFile = useCallback((file: File, isDocument: boolean = true): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Size validation
    if (file.size > FILE_CONSTRAINTS.maxSize) {
      errors.push(`File size must be less than ${FILE_CONSTRAINTS.maxSize / (1024 * 1024)}MB`);
    }

    // Type validation
    if (!FILE_CONSTRAINTS.allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${FILE_CONSTRAINTS.allowedTypes.join(', ')}`);
    }

    // Extension validation
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!FILE_CONSTRAINTS.allowedExtensions.includes(extension)) {
      errors.push(`File extension not allowed. Allowed extensions: ${FILE_CONSTRAINTS.allowedExtensions.join(', ')}`);
    }

    // Document-specific validation
    if (isDocument) {
      // For documents, prefer PDF or images
      if (!['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
        errors.push('Identity documents should be images (JPG, PNG) or PDF files');
      }
    } else {
      // For selfies, only images
      if (!file.type.startsWith('image/')) {
        errors.push('Selfie must be an image file (JPG or PNG)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Validate form data before submission
  const validateFormData = useCallback((data: Partial<KycSubmissionData>): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Full name validation
    if (!data.fullName || data.fullName.trim().length < 2) {
      errors.fullName = 'Full name is required and must be at least 2 characters';
    } else if (!/^[a-zA-Z\s\-\'\.]+$/.test(data.fullName.trim())) {
      errors.fullName = 'Full name can only contain letters, spaces, hyphens, apostrophes, and periods';
    }

    // Date of birth validation
    if (!data.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (isNaN(dob.getTime())) {
        errors.dateOfBirth = 'Invalid date format';
      } else if (age < 18) {
        errors.dateOfBirth = 'Must be at least 18 years old';
      } else if (age > 120) {
        errors.dateOfBirth = 'Invalid date of birth';
      }
    }

    // Country validation
    if (!data.countryOfResidence) {
      errors.countryOfResidence = 'Country of residence is required';
    } else if (data.countryOfResidence.length !== 2) {
      errors.countryOfResidence = 'Invalid country code';
    }

    // Address validation
    if (!data.residentialAddress || data.residentialAddress.trim().length < 10) {
      errors.residentialAddress = 'Residential address is required and must be at least 10 characters';
    } else if (data.residentialAddress.length > 500) {
      errors.residentialAddress = 'Address is too long (maximum 500 characters)';
    }

    // Documents validation
    const documents = Array.from(data.documents || []);
    if (documents.length === 0) {
      errors.documents = 'At least one identity document is required';
    } else if (documents.length > FILE_CONSTRAINTS.maxDocuments) {
      errors.documents = `Maximum ${FILE_CONSTRAINTS.maxDocuments} documents allowed`;
    } else {
      // Validate each document file
      for (const doc of documents) {
        const validation = validateFile(doc, true);
        if (!validation.isValid) {
          errors.documents = validation.errors.join(', ');
          break;
        }
      }
    }

    // Document types validation
    if (!data.documentTypes || data.documentTypes.length === 0) {
      errors.documentTypes = 'Document types are required';
    } else if (data.documentTypes.length !== documents.length) {
      errors.documentTypes = 'Number of document types must match number of uploaded documents';
    }

    // Selfie validation
    const selfies = Array.from(data.selfie || []);
    if (selfies.length === 0) {
      errors.selfie = 'Selfie is required for identity verification';
    } else if (selfies.length > FILE_CONSTRAINTS.maxSelfies) {
      errors.selfie = 'Only one selfie is allowed';
    } else {
      const validation = validateFile(selfies[0], false);
      if (!validation.isValid) {
        errors.selfie = validation.errors.join(', ');
      }
    }

    return errors;
  }, [validateFile]);

  // Submit KYC data
  const submitKyc = useCallback(async (data: KycSubmissionData): Promise<KycSubmissionResponse | null> => {
    try {
      setFormState(prev => ({ ...prev, isSubmitting: true, apiError: null }));

      // Validate form data
      const validationErrors = validateFormData(data);
      if (Object.keys(validationErrors).length > 0) {
        setFormState(prev => ({ 
          ...prev, 
          errors: validationErrors, 
          isSubmitting: false 
        }));
        toast.error('Please fix the form errors before submitting');
        return null;
      }

      // Clear errors and start upload progress tracking
      setFormState(prev => ({ ...prev, errors: {} }));
      
      // Initialize progress tracking
      const allFiles = [...Array.from(data.documents), ...Array.from(data.selfie)];
      setUploadProgress(
        allFiles.map(file => ({
          fileName: file.name,
          progress: 0,
          status: 'uploading' as const
        }))
      );

      // Submit to backend
      const response = await KycService.submitKyc(data);

      // Update progress to completed
      setUploadProgress(prev => 
        prev.map(p => ({ ...p, progress: 100, status: 'completed' as const }))
      );

      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        success: true 
      }));

      toast.success('KYC documents submitted successfully!');
      return response;

    } catch (error) {
      console.error('KYC submission error:', error);
      
      // Update progress to error state
      setUploadProgress(prev => 
        prev.map(p => ({ ...p, status: 'error' as const, error: 'Upload failed' }))
      );

      let errorMessage = 'Failed to submit KYC documents. Please try again.';
      
      if (error instanceof KycApiError) {
        errorMessage = error.message;
        
        // Handle validation errors from backend
        if (error.errors && error.errors.length > 0) {
          const backendErrors: ValidationErrors = {};
          error.errors.forEach(err => {
            backendErrors[err.field as keyof ValidationErrors] = err.message;
          });
          
          setFormState(prev => ({ 
            ...prev, 
            errors: backendErrors, 
            isSubmitting: false,
            apiError: errorMessage
          }));
        } else {
          setFormState(prev => ({ 
            ...prev, 
            isSubmitting: false,
            apiError: errorMessage
          }));
        }
      } else {
        setFormState(prev => ({ 
          ...prev, 
          isSubmitting: false,
          apiError: errorMessage
        }));
      }

      toast.error(errorMessage);
      return null;
    }
  }, [validateFormData]);

  // Resubmit KYC data after rejection
  const resubmitKyc = useCallback(async (data: KycSubmissionData): Promise<KycSubmissionResponse | null> => {
    try {
      setFormState(prev => ({ ...prev, isSubmitting: true, apiError: null }));

      // Validate form data
      const validationErrors = validateFormData(data);
      if (Object.keys(validationErrors).length > 0) {
        setFormState(prev => ({ 
          ...prev, 
          errors: validationErrors, 
          isSubmitting: false 
        }));
        toast.error('Please fix the form errors before resubmitting');
        return null;
      }

      // Clear errors and start upload progress tracking
      setFormState(prev => ({ ...prev, errors: {} }));
      
      // Initialize progress tracking
      const allFiles = [...Array.from(data.documents), ...Array.from(data.selfie)];
      setUploadProgress(
        allFiles.map(file => ({
          fileName: file.name,
          progress: 0,
          status: 'uploading' as const
        }))
      );

      // Resubmit to backend
      const response = await KycService.resubmitKyc(data);

      // Update progress to completed
      setUploadProgress(prev => 
        prev.map(p => ({ ...p, progress: 100, status: 'completed' as const }))
      );

      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        success: true 
      }));

      toast.success('KYC documents resubmitted successfully!');
      return response;

    } catch (error) {
      console.error('KYC resubmission error:', error);
      
      let errorMessage = 'Failed to resubmit KYC documents. Please try again.';
      
      if (error instanceof KycApiError) {
        errorMessage = error.message;
      }

      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        apiError: errorMessage
      }));

      toast.error(errorMessage);
      return null;
    }
  }, [validateFormData]);

  // Reset form state
  const resetFormState = useCallback(() => {
    setFormState({
      isSubmitting: false,
      errors: {},
      apiError: null,
      success: false
    });
    setUploadProgress([]);
  }, []);

  return {
    formState,
    uploadProgress,
    submitKyc,
    resubmitKyc,
    validateFile,
    validateFormData,
    resetFormState,
    FILE_CONSTRAINTS
  };
};

// Custom hook for KYC status management
export const useKycStatus = () => {
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch KYC status
  const fetchKycStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await KycService.getKycStatus();
      setKycStatus(response);
    } catch (error) {
      console.error('Fetch KYC status error:', error);
      const errorMessage = error instanceof KycApiError 
        ? error.message 
        : 'Failed to fetch KYC status';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Download document
  const downloadDocument = useCallback(async (filename: string) => {
    try {
      const blob = await KycService.downloadDocument(filename);
      
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

  // Delete KYC data (GDPR)
  const deleteKycData = useCallback(async (): Promise<boolean> => {
    try {
      const response = await KycService.deleteKycData();
      toast.success(response.message);
      // Refresh status after deletion
      await fetchKycStatus();
      return true;
    } catch (error) {
      console.error('Delete KYC data error:', error);
      const errorMessage = error instanceof KycApiError 
        ? error.message 
        : 'Failed to delete KYC data';
      toast.error(errorMessage);
      return false;
    }
  }, [fetchKycStatus]);

  // Auto-fetch status on mount
  useEffect(() => {
    fetchKycStatus();
  }, [fetchKycStatus]);

  return {
    kycStatus,
    isLoading,
    error,
    fetchKycStatus,
    downloadDocument,
    deleteKycData
  };
};

// Custom hook for creating file previews
export const useFilePreview = () => {
  const createDocumentPreview = useCallback((file: File, type: any): DocumentPreview => {
    const { isValid, errors } = useKycSubmission().validateFile(file, true);
    
    return {
      file,
      preview: URL.createObjectURL(file),
      type,
      isValid,
      errors
    };
  }, []);

  const createSelfiePreview = useCallback((file: File): SelfiePreview => {
    const { isValid, errors } = useKycSubmission().validateFile(file, false);
    
    return {
      file,
      preview: URL.createObjectURL(file),
      isValid,
      errors
    };
  }, []);

  const revokePreviewUrl = useCallback((preview: string) => {
    URL.revokeObjectURL(preview);
  }, []);

  return {
    createDocumentPreview,
    createSelfiePreview,
    revokePreviewUrl
  };
};