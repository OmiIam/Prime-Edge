/**
 * Environment Setup for Tests
 * Runs before each test file
 */

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-automated-testing-only';
process.env.MOCK_BANK_DELAY_MS = '100'; // Fast for testing
process.env.RATE_LIMIT_WINDOW_MS = '60000'; // 1 minute window for testing
process.env.RATE_LIMIT_MAX_REQUESTS = '5'; // Lower limit for rate limiting tests

// Suppress console.log in tests unless explicitly needed
if (!process.env.DEBUG_TESTS) {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };
  
  // Only show warnings and errors during tests
  console.log = () => {};
  console.info = () => {};
  
  // Keep important logs available via DEBUG_TESTS env var
  global.testConsole = originalConsole;
}