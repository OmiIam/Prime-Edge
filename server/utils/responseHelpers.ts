/**
 * Standardized API response helpers
 * All responses follow the format: { success: boolean, message: string, data?: any }
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  message: string, 
  data?: T
): ApiResponse<T> {
  return {
    success: true,
    message,
    data
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string, 
  data?: any
): ApiResponse {
  return {
    success: false,
    message,
    data
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  message: string,
  items: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    message,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  };
}

/**
 * Input validation helpers
 */
export function validateAmount(amount: any): { isValid: boolean; value?: number; error?: string } {
  if (amount === undefined || amount === null) {
    return { isValid: false, error: 'Amount is required' };
  }

  const numAmount = Number(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }

  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (numAmount > 1000000) { // 1M limit
    return { isValid: false, error: 'Amount exceeds maximum transfer limit of 1,000,000' };
  }

  // Check decimal places (max 2)
  const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
  }

  return { isValid: true, value: numAmount };
}

export function validateCurrency(currency: any): { isValid: boolean; value?: string; error?: string } {
  if (!currency) {
    return { isValid: true, value: 'USD' }; // Default currency
  }

  if (typeof currency !== 'string') {
    return { isValid: false, error: 'Currency must be a string' };
  }

  const allowedCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];
  const upperCurrency = currency.toUpperCase();
  
  if (!allowedCurrencies.includes(upperCurrency)) {
    return { isValid: false, error: `Currency must be one of: ${allowedCurrencies.join(', ')}` };
  }

  return { isValid: true, value: upperCurrency };
}

export function validateRecipientInfo(recipientInfo: any): { isValid: boolean; error?: string } {
  if (!recipientInfo || typeof recipientInfo !== 'object') {
    return { isValid: false, error: 'Recipient information is required' };
  }

  const { name, accountNumber, bankCode } = recipientInfo;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return { isValid: false, error: 'Recipient name must be at least 2 characters' };
  }

  if (!accountNumber || typeof accountNumber !== 'string') {
    return { isValid: false, error: 'Account number is required' };
  }

  // Basic account number validation (adjust for your requirements)
  if (!/^\d{8,20}$/.test(accountNumber)) {
    return { isValid: false, error: 'Account number must be 8-20 digits' };
  }

  if (!bankCode || typeof bankCode !== 'string') {
    return { isValid: false, error: 'Bank code is required' };
  }

  // Basic bank code validation (adjust for your requirements)  
  if (!/^[A-Z0-9]{3,10}$/.test(bankCode.toUpperCase())) {
    return { isValid: false, error: 'Bank code must be 3-10 alphanumeric characters' };
  }

  return { isValid: true };
}

/**
 * Pagination helpers
 */
export function validatePagination(page?: any, limit?: any) {
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // Max 100 items per page
  
  return { page: pageNum, limit: limitNum };
}

/**
 * Date validation helpers
 */
export function validateSinceDate(since?: any): { isValid: boolean; value?: Date; error?: string } {
  if (!since) {
    return { isValid: true };
  }

  const date = new Date(since);
  
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format for "since" parameter' };
  }

  // Prevent querying too far in the past (e.g., more than 1 year)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  if (date < oneYearAgo) {
    return { isValid: false, error: 'Cannot query data older than 1 year' };
  }

  return { isValid: true, value: date };
}