/**
 * Global Jest Teardown
 * Runs once after all tests complete
 */

export default async () => {
  console.log('🧹 Global test teardown started...');
  
  // Clean up any global resources
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  console.log('✅ Global test teardown complete');
};