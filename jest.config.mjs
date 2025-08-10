/** @type {import('jest').Config} */
const config = {
  // Test environment
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  
  // Root directories
  roots: ['<rootDir>/server'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/server/tests/**/*.test.ts',
    '<rootDir>/server/**/__tests__/**/*.ts'
  ],
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      isolatedModules: true,
    }],
  },
  
  // Module path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/server/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/server/tests/setup.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage collection patterns
  collectCoverageFrom: [
    '<rootDir>/server/**/*.ts',
    '!<rootDir>/server/**/*.d.ts',
    '!<rootDir>/server/tests/**/*',
    '!<rootDir>/server/node_modules/**',
    '!<rootDir>/server/dist/**',
    '!<rootDir>/server/coverage/**',
    '!<rootDir>/server/index.ts', // Entry point - hard to test in isolation
  ],
  
  // Coverage thresholds (disabled for demonstration - would be enabled in real environment)
  // coverageThreshold: {
  //   global: {
  //     branches: 75,
  //     functions: 75,
  //     lines: 75,
  //     statements: 75,
  //   },
  // },
  
  // Test timeout (longer for integration tests)
  testTimeout: 30000,
  
  // Error handling
  bail: 0, // Don't stop on first failure
  verbose: true,
  
  // Performance
  maxWorkers: '50%',
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Handle ES modules
  extensionsToTreatAsEsm: ['.ts'],
};

export default config;