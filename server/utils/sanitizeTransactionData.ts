import { Decimal } from '@prisma/client/runtime/library';

/**
 * Sanitizes transaction data to prevent circular references and ensure JSON safety
 * Returns a plain serializable object with only safe fields
 */
export function sanitizeTransactionData(transaction: any) {
  if (!transaction) return null;

  // Handle Prisma Decimal type conversion
  const amount = transaction.amount instanceof Decimal 
    ? transaction.amount.toNumber() 
    : Number(transaction.amount) || 0;

  return {
    id: String(transaction.id || ''),
    userId: String(transaction.userId || ''),
    type: String(transaction.type || ''),
    amount: amount,
    currency: String(transaction.currency || 'NGN'),
    status: String(transaction.status || 'PENDING'),
    description: transaction.description ? String(transaction.description) : null,
    reference: transaction.reference ? String(transaction.reference) : null,
    metadata: sanitizeMetadata(transaction.metadata),
    createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Sanitizes metadata objects to ensure they're serializable
 */
export function sanitizeMetadata(metadata: any): Record<string, any> | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
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
      // Skip complex types like functions, symbols, etc.
    }
  }

  return clean;
}

/**
 * Sanitizes user data for admin transfer listings
 */
export function sanitizeUserForAdmin(user: any) {
  if (!user) return null;

  return {
    id: String(user.id || ''),
    email: String(user.email || ''),
    name: String(user.name || ''),
    accountNumber: String(user.accountNumber || ''),
    kycStatus: String(user.kycStatus || 'PENDING'),
  };
}

/**
 * Creates a sanitized transfer list item for admin view
 */
export function sanitizeTransferForAdmin(transaction: any, user?: any) {
  const sanitizedTransaction = sanitizeTransactionData(transaction);
  
  if (!sanitizedTransaction) return null;

  return {
    ...sanitizedTransaction,
    user: user ? sanitizeUserForAdmin(user) : null,
  };
}