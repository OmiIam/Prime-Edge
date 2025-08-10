/**
 * Test Results Processor
 * Post-processes test results and generates additional reports
 */

import fs from 'fs';
import path from 'path';

export default (results) => {
  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    testSuites: results.numTotalTestSuites,
    tests: results.numTotalTests,
    passed: results.numPassedTests,
    failed: results.numFailedTests,
    skipped: results.numPendingTests,
    runtime: results.testResults.reduce((total, suite) => total + (suite.perfStats?.runtime || 0), 0),
    coverage: results.coverageMap ? {
      statements: results.coverageMap.getCoverageSummary().statements.pct,
      branches: results.coverageMap.getCoverageSummary().branches.pct,
      functions: results.coverageMap.getCoverageSummary().functions.pct,
      lines: results.coverageMap.getCoverageSummary().lines.pct,
    } : null,
    success: results.success
  };

  // Write summary to file
  const summaryPath = path.join(process.cwd(), 'coverage', 'test-summary.json');
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  // Generate detailed failure report if there are failures
  if (results.numFailedTests > 0) {
    const failures = results.testResults
      .filter(suite => suite.numFailingTests > 0)
      .map(suite => ({
        testFilePath: suite.testFilePath,
        failureMessages: suite.testResults
          .filter(test => test.status === 'failed')
          .map(test => ({
            title: test.fullName,
            errorMessage: test.failureMessages?.join('\n') || 'Unknown error'
          }))
      }));

    const failureReportPath = path.join(process.cwd(), 'coverage', 'failure-report.json');
    fs.writeFileSync(failureReportPath, JSON.stringify(failures, null, 2));
  }

  console.log('\n📊 Test Results Summary:');
  console.log(`   Test Suites: ${summary.testSuites} total`);
  console.log(`   Tests: ${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped`);
  console.log(`   Runtime: ${(summary.runtime / 1000).toFixed(2)}s`);
  
  if (summary.coverage) {
    console.log(`   Coverage: ${summary.coverage.lines.toFixed(1)}% lines, ${summary.coverage.branches.toFixed(1)}% branches`);
  }
  
  console.log(`   Success: ${summary.success ? '✅' : '❌'}`);
  console.log(`\n📁 Reports saved to: ${path.join(process.cwd(), 'coverage')}`);

  return results;
};