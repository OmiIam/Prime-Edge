/**
 * Data Sanitization Utilities
 * Prevents circular references and ensures JSON serialization safety
 */

/**
 * Sanitized transaction object for API responses
 */
export interface SanitizedTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any> | null;
}

/**
 * Sanitizes a transaction object to prevent circular references and ensure JSON safety
 * Strips out Prisma relations and non-serializable properties
 */
export const sanitizeTransactionData = (transaction: any): SanitizedTransaction => {
  if (!transaction) {
    throw new Error('Transaction object is required');
  }

  return {
    id: String(transaction.id || ''),
    userId: String(transaction.userId || ''),
    type: String(transaction.type || ''),
    amount: Number(transaction.amount || 0),
    status: String(transaction.status || 'PENDING'),
    description: String(transaction.description || ''),
    createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt).toISOString() : new Date().toISOString(),
    metadata: sanitizeMetadata(transaction.metadata)
  };
};

/**
 * Sanitizes metadata objects to ensure they contain only serializable data
 */
export const sanitizeMetadata = (metadata: any): Record<string, any> | null => {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const clean: Record<string, any> = {};

  // Only include serializable primitive values and simple objects
  for (const key in metadata) {
    if (Object.prototype.hasOwnProperty.call(metadata, key)) {
      const value = metadata[key];
      
      if (value === null || value === undefined) {
        clean[key] = value;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        clean[key] = value;
      } else if (value instanceof Date) {
        clean[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        // Only include arrays of primitives
        clean[key] = value.filter(item => 
          typeof item === 'string' || 
          typeof item === 'number' || 
          typeof item === 'boolean'
        );
      } else if (typeof value === 'object') {
        // Recursively sanitize nested objects (max depth 2)
        clean[key] = sanitizeNestedObject(value, 1);
      }
      // Skip functions, symbols, and other complex types
    }
  }

  return Object.keys(clean).length > 0 ? clean : null;
};

/**
 * Helper function to sanitize nested objects with depth control
 */
const sanitizeNestedObject = (obj: any, depth: number): Record<string, any> => {
  if (depth > 2 || !obj || typeof obj !== 'object') {
    return {};
  }

  const clean: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (value === null || value === undefined) {
        clean[key] = value;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        clean[key] = value;
      } else if (value instanceof Date) {
        clean[key] = value.toISOString();
      } else if (typeof value === 'object' && depth < 2) {
        clean[key] = sanitizeNestedObject(value, depth + 1);
      }
    }
  }

  return clean;
};

/**
 * Standard API response formatter
 */
export const createApiResponse = (
  success: boolean,
  message: string,
  data: any = null
): { success: boolean; message: string; data: any } => {
  return {
    success,
    message,
    data
  };
};

/**
 * Error response formatter with optional error details
 */
export const createErrorResponse = (
  message: string,
  details?: any
): { success: false; message: string; data: any } => {
  return {
    success: false,
    message,
    data: details || null
  };
};

/**
 * Success response formatter
 */
export const createSuccessResponse = (
  message: string,
  data: any = null
): { success: true; message: string; data: any } => {
  return {
    success: true,
    message,
    data
  };
};

/**
 * Validates that an object can be safely JSON.stringified
 */
export const isJsonSafe = (obj: any): boolean => {
  try {
    JSON.stringify(obj);
    return true;
  } catch {
    return false;
  }
};