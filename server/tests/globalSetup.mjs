/**
 * Global Jest Setup
 * Runs once before all tests
 */

import { execSync } from 'child_process';

export default async () => {
  console.log('🚀 Global test setup started...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-automated-testing-only';
  process.env.MOCK_BANK_DELAY_MS = '100';
  process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  // Ensure test database is available
  if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
    console.warn('⚠️ No TEST_DATABASE_URL or DATABASE_URL environment variable found');
    console.warn('⚠️ Tests will use in-memory database or skip database-dependent tests');
  }
  
  console.log('✅ Global test setup complete');
};