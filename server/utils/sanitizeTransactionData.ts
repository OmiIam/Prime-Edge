import { Decimal } from '@prisma/client/runtime/library';

/**
 * Transaction sanitization utilities
 * Strips ORM prototypes and prevents circular references for safe JSON serialization
 */

export interface SanitizedTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  metadata: Record<string, any> | null;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Sanitize a single transaction object
 * Removes Prisma prototypes and converts Decimal to number
 */
export function sanitizeTransaction(transaction: any): SanitizedTransaction | null {
  if (!transaction) return null;

  try {
    return {
      id: String(transaction.id || ''),
      userId: String(transaction.userId || ''),
      type: String(transaction.type || ''),
      amount: transaction.amount instanceof Decimal 
        ? transaction.amount.toNumber() 
        : Number(transaction.amount) || 0,
      currency: String(transaction.currency || 'USD'),
      status: String(transaction.status || 'PENDING'),
      description: transaction.description ? String(transaction.description) : null,
      metadata: sanitizeMetadata(transaction.metadata),
      reference: transaction.reference ? String(transaction.reference) : null,
      createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt).toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Sanitize] Error sanitizing transaction:', error);
    return null;
  }
}

/**
 * Sanitize an array of transactions
 */
export function sanitizeTransactions(transactions: any[]): SanitizedTransaction[] {
  if (!Array.isArray(transactions)) return [];
  
  return transactions
    .map(sanitizeTransaction)
    .filter((t): t is SanitizedTransaction => t !== null);
}

/**
 * Sanitize user data for admin views
 */
export function sanitizeUser(user: any): SanitizedUser | null {
  if (!user) return null;

  try {
    return {
      id: String(user.id || ''),
      email: String(user.email || ''),
      name: String(user.name || ''),
      role: String(user.role || 'USER'),
    };
  } catch (error) {
    console.error('[Sanitize] Error sanitizing user:', error);
    return null;
  }
}

/**
 * Sanitize transaction with user data (for admin views)
 */
export function sanitizeTransactionWithUser(transaction: any): (SanitizedTransaction & { user: SanitizedUser | null }) | null {
  const sanitizedTransaction = sanitizeTransaction(transaction);
  if (!sanitizedTransaction) return null;

  return {
    ...sanitizedTransaction,
    user: transaction.user ? sanitizeUser(transaction.user) : null
  };
}

/**
 * Sanitize metadata object to ensure JSON serializability
 */
function sanitizeMetadata(metadata: any): Record<string, any> | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  try {
    // Create a plain object without prototype
    const clean: Record<string, any> = {};
    
    for (const key in metadata) {
      if (Object.prototype.hasOwnProperty.call(metadata, key)) {
        const value = metadata[key];
        clean[key] = sanitizeValue(value);
      }
    }

    return clean;
  } catch (error) {
    console.error('[Sanitize] Error sanitizing metadata:', error);
    return null;
  }
}

/**
 * Recursively sanitize any value to ensure JSON serializability
 */
function sanitizeValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Decimal) {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object') {
    const clean: Record<string, any> = {};
    
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        // Prevent deep nesting that could cause issues
        if (typeof value[key] === 'object' && value[key] !== null) {
          // Only go one level deep for nested objects
          if (Array.isArray(value[key])) {
            clean[key] = value[key].map((item: any) => 
              typeof item === 'object' ? JSON.parse(JSON.stringify(item)) : item
            );
          } else {
            clean[key] = JSON.parse(JSON.stringify(value[key]));
          }
        } else {
          clean[key] = sanitizeValue(value[key]);
        }
      }
    }
    
    return clean;
  }

  // For any other types (functions, symbols, etc.), return null
  return null;
}

/**
 * Create a completely clean object without any prototype chain
 */
export function createCleanObject<T = Record<string, any>>(source: any): T {
  if (!source || typeof source !== 'object') {
    return source as T;
  }

  // Use JSON parse/stringify to remove all prototype chains and ensure serializability
  try {
    const jsonString = JSON.stringify(source);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('[Sanitize] Error creating clean object:', error);
    return {} as T;
  }
}

/**
 * Validate that an object is safely serializable
 */
export function validateSerializable(obj: any): boolean {
  try {
    JSON.stringify(obj);
    return true;
  } catch (error) {
    console.error('[Sanitize] Object not serializable:', error);
    return false;
  }
}