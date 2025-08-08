/**
 * Safe JSON serialization utilities to prevent circular reference errors
 * and ensure only serializable data is processed.
 */

interface SerializableValue {
  [key: string]: string | number | boolean | null | undefined | SerializableValue | SerializableValue[];
}

/**
 * Creates a completely clean object with no prototype chain or circular references
 * Ensures all values are primitive types or plain objects/arrays
 */
export function createCleanObject<T = Record<string, any>>(source: any): T {
  const clean = Object.create(null) as T;
  
  if (!source || typeof source !== 'object') {
    return clean;
  }

  // Iterate only own enumerable properties
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      
      // Only include serializable primitive values
      if (value === null || value === undefined) {
        (clean as any)[key] = value;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        (clean as any)[key] = value;
      } else if (Array.isArray(value)) {
        // Handle arrays by recursively cleaning each element
        (clean as any)[key] = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            return createCleanObject(item);
          }
          return typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean' 
            ? item : null;
        });
      } else if (typeof value === 'object') {
        // Recursively clean nested objects
        (clean as any)[key] = createCleanObject(value);
      }
      // Skip functions, symbols, and other non-serializable types
    }
  }

  return clean;
}

/**
 * Safe JSON stringify with circular reference detection and removal
 * Returns a guaranteed serializable string
 */
export function safeStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  
  try {
    return JSON.stringify(obj, (key, value) => {
      // Handle null and primitive values
      if (value === null || typeof value !== 'object') {
        return value;
      }
      
      // Detect circular references
      if (seen.has(value)) {
        return '[Circular Reference Removed]';
      }
      seen.add(value);
      
      // Handle arrays
      if (Array.isArray(value)) {
        return value;
      }
      
      // Handle plain objects only
      if (Object.prototype.toString.call(value) === '[object Object]') {
        const clean: Record<string, any> = {};
        for (const prop in value) {
          if (Object.prototype.hasOwnProperty.call(value, prop)) {
            const propValue = value[prop];
            // Only include serializable values
            if (propValue === null || 
                typeof propValue === 'string' || 
                typeof propValue === 'number' || 
                typeof propValue === 'boolean' ||
                Array.isArray(propValue) ||
                (typeof propValue === 'object' && Object.prototype.toString.call(propValue) === '[object Object]')) {
              clean[prop] = propValue;
            }
          }
        }
        return clean;
      }
      
      // Replace complex objects with safe representation
      return '[Complex Object Removed]';
    }, space);
  } catch (error) {
    console.error('JSON stringify error:', error);
    // Ultimate fallback - return empty object string
    return '{}';
  }
}

/**
 * Validates that an object is fully serializable
 * Returns true if the object can be safely JSON.stringify'd
 */
export function isSerializable(obj: any): boolean {
  try {
    JSON.stringify(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates transfer data with guaranteed serializability
 * Specifically designed for banking transfer operations
 */
export function createTransferPayload(data: {
  amount?: string | number;
  recipientInfo?: string;
  transferType?: string;
  bankName?: string;
}): SerializableValue {
  const payload = Object.create(null);
  
  // Amount - ensure it's a valid number
  if (data.amount !== undefined && data.amount !== null && data.amount !== '') {
    const numAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    payload.amount = isNaN(numAmount) ? 0 : numAmount;
  } else {
    payload.amount = 0;
  }
  
  // Recipient info - ensure it's a clean string
  payload.recipientInfo = data.recipientInfo ? String(data.recipientInfo).trim() : '';
  
  // Transfer type - ensure it's a clean string
  payload.transferType = data.transferType ? String(data.transferType).trim() : '';
  
  // Bank name - only for external transfers
  if (data.transferType === 'external_bank' && data.bankName) {
    payload.bankName = String(data.bankName).trim();
  }
  
  return payload;
}

/**
 * Debug function to inspect object structure and detect potential issues
 */
export function debugObject(obj: any, maxDepth: number = 3): void {
  console.group('🔍 Object Structure Analysis');
  
  function inspect(value: any, depth: number, path: string = 'root'): void {
    if (depth > maxDepth) {
      console.log(`${path}: [Max depth reached]`);
      return;
    }
    
    if (value === null) {
      console.log(`${path}: null`);
    } else if (value === undefined) {
      console.log(`${path}: undefined`);
    } else if (typeof value === 'function') {
      console.log(`${path}: [Function] ${value.name || 'anonymous'}`);
    } else if (typeof value === 'symbol') {
      console.log(`${path}: [Symbol] ${String(value)}`);
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        console.log(`${path}: [Array] length=${value.length}`);
        value.forEach((item, index) => {
          inspect(item, depth + 1, `${path}[${index}]`);
        });
      } else {
        const constructor = value.constructor?.name || 'Unknown';
        console.log(`${path}: [Object] constructor=${constructor}`);
        
        // Check for potential circular references
        try {
          JSON.stringify(value);
        } catch {
          console.warn(`⚠️  ${path}: Contains circular references or non-serializable data`);
        }
        
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            inspect(value[key], depth + 1, `${path}.${key}`);
          }
        }
      }
    } else {
      console.log(`${path}: [${typeof value}] ${String(value)}`);
    }
  }
  
  inspect(obj, 0);
  console.groupEnd();
}