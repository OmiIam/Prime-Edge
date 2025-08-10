/**
 * Custom Test Sequencer
 * Controls the order in which tests run for optimal performance
 */

import { default as Sequencer } from '@jest/test-sequencer';

class CustomTestSequencer extends Sequencer {
  sort(tests) {
    // Define test execution order for optimal performance
    const testOrder = [
      'setup.test.ts',              // Setup tests first
      'basic.test.ts',              // Basic Jest tests
      'utils.test.ts',              // Utility function tests
      'migration-script.test.ts',   // Migration script validation
      'database-migration.test.ts', // Database migration tests
      'schema-validation.test.ts',  // Schema validation tests
      'transfer.test.ts',           // Unit tests
      'transfer-endpoints.test.ts', // HTTP endpoint tests  
      'socket-events.test.ts',      // Socket.IO tests
      'integration.test.ts',        // Integration tests last
    ];

    return tests.sort((testA, testB) => {
      const aIndex = testOrder.findIndex(pattern => testA.path.includes(pattern));
      const bIndex = testOrder.findIndex(pattern => testB.path.includes(pattern));
      
      // If both tests match patterns, use the defined order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one matches, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither matches, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }
}

export default CustomTestSequencer;