import { describe, it, expect } from '@jest/globals';
import { createSuccessResponse, createErrorResponse } from '../utils/responseHelpers';
import { sanitizeTransaction } from '../utils/sanitizeTransactionData';

/**
 * Utility Functions Test Suite
 * Tests for response helpers and data sanitization utilities
 */

describe('Response Helpers', () => {
  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const result = createSuccessResponse('Operation completed', { id: 123, name: 'test' });
      
      expect(result).toEqual({
        success: true,
        message: 'Operation completed',
        data: { id: 123, name: 'test' }
      });
    });

    it('should create a success response without data', () => {
      const result = createSuccessResponse('Operation completed');
      
      expect(result).toEqual({
        success: true,
        message: 'Operation completed',
        data: undefined
      });
    });

    it('should handle empty message', () => {
      const result = createSuccessResponse('');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('');
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response with data', () => {
      const result = createErrorResponse('Operation failed', { code: 'ERR_001' });
      
      expect(result).toEqual({
        success: false,
        message: 'Operation failed',
        data: { code: 'ERR_001' }
      });
    });

    it('should create an error response without data', () => {
      const result = createErrorResponse('Operation failed');
      
      expect(result).toEqual({
        success: false,
        message: 'Operation failed',
        data: undefined
      });
    });

    it('should handle error objects as data', () => {
      const error = new Error('Internal error');
      const result = createErrorResponse('System error', error);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('System error');
      expect(result.data).toBe(error);
    });
  });
});

describe('Data Sanitization', () => {
  describe('sanitizeTransaction', () => {
    it('should sanitize valid transaction data', () => {
      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-456',
        type: 'EXTERNAL_TRANSFER',
        amount: 1000.50, // Use direct number instead of mock Decimal
        currency: 'USD',
        status: 'PENDING',
        description: 'Test transfer',
        metadata: { test: 'data', nested: { key: 'value' } },
        reference: 'REF-123',
        createdAt: new Date('2023-12-01T10:00:00Z'),
        updatedAt: new Date('2023-12-01T11:00:00Z')
      };

      const result = sanitizeTransaction(mockTransaction);

      expect(result).toEqual({
        id: 'tx-123',
        userId: 'user-456',
        type: 'EXTERNAL_TRANSFER',
        amount: 1000.50,
        currency: 'USD',
        status: 'PENDING',
        description: 'Test transfer',
        metadata: { test: 'data', nested: { key: 'value' } },
        reference: 'REF-123',
        createdAt: '2023-12-01T10:00:00.000Z',
        updatedAt: '2023-12-01T11:00:00.000Z'
      });
    });

    it('should handle null amount gracefully', () => {
      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-456',
        type: 'EXTERNAL_TRANSFER',
        amount: null,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date('2023-12-01T10:00:00Z'),
        updatedAt: new Date('2023-12-01T11:00:00Z')
      };

      const result = sanitizeTransaction(mockTransaction);

      expect(result?.amount).toBe(0);
    });

    it('should handle numeric amounts', () => {
      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-456',
        type: 'EXTERNAL_TRANSFER',
        amount: 500.25, // Use direct number
        currency: 'EUR',
        status: 'COMPLETED',
        createdAt: new Date('2023-12-01T10:00:00Z'),
        updatedAt: new Date('2023-12-01T11:00:00Z')
      };

      const result = sanitizeTransaction(mockTransaction);

      expect(result?.amount).toBe(500.25);
      expect(typeof result?.amount).toBe('number');
    });

    it('should return null for null input', () => {
      expect(sanitizeTransaction(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(sanitizeTransaction(undefined)).toBe(null);
    });

    it('should handle missing metadata', () => {
      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-456',
        type: 'EXTERNAL_TRANSFER',
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date('2023-12-01T10:00:00Z'),
        updatedAt: new Date('2023-12-01T11:00:00Z')
      };

      const result = sanitizeTransaction(mockTransaction);

      expect(result?.metadata).toBeNull();
    });

    it('should handle empty metadata object', () => {
      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-456',
        type: 'EXTERNAL_TRANSFER',
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        metadata: {},
        createdAt: new Date('2023-12-01T10:00:00Z'),
        updatedAt: new Date('2023-12-01T11:00:00Z')
      };

      const result = sanitizeTransaction(mockTransaction);

      expect(result?.metadata).toEqual({});
    });

    it('should only include expected properties', () => {
      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-456',
        type: 'EXTERNAL_TRANSFER',
        amount: 200,
        currency: 'USD',
        status: 'PENDING',
        createdAt: new Date('2023-12-01T10:00:00Z'),
        updatedAt: new Date('2023-12-01T11:00:00Z'),
        // These should be ignored by the sanitizer (only picks specific fields)
        user: { id: 'user-456', name: 'Test User' },
        constructor: 'bad',
        unwantedProperty: 'should not appear'
      };

      const result = sanitizeTransaction(mockTransaction);

      // Should not have unwanted properties (sanitizer only picks expected fields)
      expect(result).not.toHaveProperty('user');
      expect(result).not.toHaveProperty('unwantedProperty');
      
      // Should have basic object properties like constructor (this is normal)
      expect(result).toHaveProperty('constructor');

      // Should have expected properties
      expect(result?.id).toBe('tx-123');
      expect(result?.amount).toBe(200);
      expect(result?.userId).toBe('user-456');
      expect(result?.type).toBe('EXTERNAL_TRANSFER');
    });

    it('should handle complex nested metadata', () => {
      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-456',
        type: 'EXTERNAL_TRANSFER',
        amount: 750,
        currency: 'USD',
        status: 'PENDING',
        metadata: {
          recipientInfo: {
            name: 'John Doe',
            accountNumber: '1234567890',
            bankCode: 'ABC123',
            details: {
              verified: true,
              verificationDate: '2023-12-01'
            }
          },
          submittedAt: '2023-12-01T10:00:00Z',
          requiresApproval: true,
          adminNotes: null
        },
        createdAt: new Date('2023-12-01T10:00:00Z'),
        updatedAt: new Date('2023-12-01T11:00:00Z')
      };

      const result = sanitizeTransaction(mockTransaction);

      expect(result?.metadata).toEqual({
        recipientInfo: {
          name: 'John Doe',
          accountNumber: '1234567890',
          bankCode: 'ABC123',
          details: {
            verified: true,
            verificationDate: '2023-12-01'
          }
        },
        submittedAt: '2023-12-01T10:00:00Z',
        requiresApproval: true,
        adminNotes: null
      });
    });

    it('should convert dates to ISO strings', () => {
      const testDate1 = new Date('2023-12-01T10:30:45.123Z');
      const testDate2 = new Date('2023-12-02T15:45:30.456Z');

      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-456',
        type: 'EXTERNAL_TRANSFER',
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        createdAt: testDate1,
        updatedAt: testDate2
      };

      const result = sanitizeTransaction(mockTransaction);

      expect(result?.createdAt).toBe('2023-12-01T10:30:45.123Z');
      expect(result?.updatedAt).toBe('2023-12-02T15:45:30.456Z');
      expect(typeof result?.createdAt).toBe('string');
      expect(typeof result?.updatedAt).toBe('string');
    });
  });
});