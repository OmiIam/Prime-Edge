/**
 * Backend response utilities to ensure all API responses are clean JSON
 * without circular references or non-serializable data
 */

/**
 * Creates a plain object by extracting only serializable properties
 * Removes prototype chains, circular references, and complex objects
 */
export function createPlainObject<T = Record<string, any>>(source: any): T {
  if (source === null || source === undefined) {
    return {} as T;
  }

  const plain = {} as T;

  // Handle primitive types
  if (typeof source !== 'object') {
    return source as T;
  }

  // Handle arrays
  if (Array.isArray(source)) {
    return source.map(item => createPlainObject(item)) as T;
  }

  // Extract only own enumerable properties
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];

      if (value === null || value === undefined) {
        (plain as any)[key] = value;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        (plain as any)[key] = value;
      } else if (value instanceof Date) {
        (plain as any)[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        (plain as any)[key] = value.map(item => createPlainObject(item));
      } else if (typeof value === 'object') {
        // Handle nested objects (including Prisma models)
        (plain as any)[key] = createPlainObject(value);
      }
      // Skip functions, symbols, and other non-serializable types
    }
  }

  return plain;
}

/**
 * Safely converts Prisma/ORM models to plain JSON objects
 * Specifically designed for banking transaction data
 */
export function sanitizeTransactionData(transaction: any) {
  if (!transaction) return null;

  return {
    id: String(transaction.id || ''),
    userId: String(transaction.userId || ''),
    type: String(transaction.type || ''),
    amount: Number(transaction.amount) || 0,
    description: String(transaction.description || ''),
    status: String(transaction.status || 'PENDING'),
    createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt).toISOString() : new Date().toISOString(),
    metadata: sanitizeMetadata(transaction.metadata)
  };
}

/**
 * Sanitizes metadata objects to ensure they're serializable
 */
export function sanitizeMetadata(metadata: any): Record<string, any> {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const clean: Record<string, any> = {};

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
        clean[key] = value.filter(item => 
          typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
        );
      } else if (typeof value === 'object') {
        // Recursively sanitize nested metadata
        clean[key] = sanitizeMetadata(value);
      }
      // Skip complex types
    }
  }

  return clean;
}

/**
 * Creates a safe JSON response with proper headers and content type
 */
export function createSafeJsonResponse(data: any, statusCode: number = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    body: createPlainObject(data)
  };
}

/**
 * Safe error response creator
 */
export function createErrorResponse(message: string, statusCode: number = 500, details?: any) {
  return createSafeJsonResponse({
    success: false,
    message: String(message),
    error: details ? createPlainObject(details) : undefined,
    timestamp: new Date().toISOString()
  }, statusCode);
}

/**
 * Success response creator with clean data
 */
export function createSuccessResponse(data: any, message?: string) {
  return createSafeJsonResponse({
    success: true,
    message: message || 'Operation completed successfully',
    data: createPlainObject(data),
    timestamp: new Date().toISOString()
  });
}

/**
 * Validates that an object is fully serializable before sending
 */
export function validateSerializable(obj: any): boolean {
  try {
    JSON.stringify(obj);
    return true;
  } catch (error) {
    console.error('Object is not serializable:', error);
    return false;
  }
}