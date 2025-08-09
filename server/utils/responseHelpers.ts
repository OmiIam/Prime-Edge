/**
 * Consistent API response helpers
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Creates a successful API response
 */
export function createSuccessResponse<T>(
  data: T, 
  message: string = 'Operation completed successfully'
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an error API response
 */
export function createErrorResponse(
  message: string, 
  data?: any
): ApiResponse {
  return {
    success: false,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a paginated success response
 */
export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Data retrieved successfully'
): PaginatedResponse<T> {
  return {
    success: true,
    message,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates decimal amounts
 */
export function validateAmount(amount: any): { isValid: boolean; value?: number; error?: string } {
  if (amount === undefined || amount === null) {
    return { isValid: false, error: 'Amount is required' };
  }

  const numAmount = Number(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Invalid amount format' };
  }

  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (numAmount > 10000000) { // 10M limit
    return { isValid: false, error: 'Amount exceeds maximum limit' };
  }

  // Check for too many decimal places
  const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
  }

  return { isValid: true, value: numAmount };
}

/**
 * Validates bank code format
 */
export function validateBankCode(bankCode: string): { isValid: boolean; error?: string } {
  if (!bankCode || typeof bankCode !== 'string') {
    return { isValid: false, error: 'Bank code is required' };
  }

  // Nigerian bank codes are typically 3-digit numbers
  const bankCodeRegex = /^\d{3}$/;
  if (!bankCodeRegex.test(bankCode)) {
    return { isValid: false, error: 'Invalid bank code format (must be 3 digits)' };
  }

  return { isValid: true };
}

/**
 * Validates account number format
 */
export function validateAccountNumber(accountNumber: string): { isValid: boolean; error?: string } {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return { isValid: false, error: 'Account number is required' };
  }

  // Nigerian account numbers are typically 10 digits
  const accountNumberRegex = /^\d{10}$/;
  if (!accountNumberRegex.test(accountNumber)) {
    return { isValid: false, error: 'Invalid account number format (must be 10 digits)' };
  }

  return { isValid: true };
}

/**
 * Validates recipient name
 */
export function validateRecipientName(name: string): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Recipient name is required' };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Recipient name must be at least 2 characters' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Recipient name cannot exceed 100 characters' };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: 'Recipient name contains invalid characters' };
  }

  return { isValid: true };
}