import { UIScreenshotGenerator } from '../server/utils/puppeteer-utils';
import { promises as fs } from 'fs';
import path from 'path';

interface BaselineConfig {
  pages: Array<{
    name: string;
    url: string;
    viewport?: { width: number; height: number };
    selector?: string;
  }>;
  baseUrl: string;
  outputDir: string;
  thresholdPercent: number;
}

class VisualRegressionTester {
  private generator: UIScreenshotGenerator;
  private config: BaselineConfig;

  constructor(config: BaselineConfig) {
    this.generator = new UIScreenshotGenerator();
    this.config = config;
  }

  async generateBaselines() {
    console.log('🎯 Generating baseline screenshots...');
    
    await fs.mkdir(path.join(this.config.outputDir, 'baselines'), { recursive: true });
    
    for (const page of this.config.pages) {
      const url = `${this.config.baseUrl}${page.url}`;
      const outputPath = path.join(this.config.outputDir, 'baselines', `${page.name}.png`);
      
      try {
        await this.generator.generateScreenshot(url, {
          width: page.viewport?.width || 1920,
          height: page.viewport?.height || 1080,
          selector: page.selector,
          outputPath,
          fullPage: !page.selector
        });
        
        console.log(`✅ Generated baseline for ${page.name}`);
      } catch (error) {
        console.error(`❌ Failed to generate baseline for ${page.name}:`, error);
      }
    }
    
    console.log('🎉 Baseline generation complete!');
  }

  async runVisualTests() {
    console.log('👀 Running visual regression tests...');
    
    await fs.mkdir(path.join(this.config.outputDir, 'current'), { recursive: true });
    await fs.mkdir(path.join(this.config.outputDir, 'diffs'), { recursive: true });
    
    const results = [];
    
    for (const page of this.config.pages) {
      const url = `${this.config.baseUrl}${page.url}`;
      const currentPath = path.join(this.config.outputDir, 'current', `${page.name}.png`);
      const baselinePath = path.join(this.config.outputDir, 'baselines', `${page.name}.png`);
      
      try {
        // Generate current screenshot
        await this.generator.generateScreenshot(url, {
          width: page.viewport?.width || 1920,
          height: page.viewport?.height || 1080,
          selector: page.selector,
          outputPath: currentPath,
          fullPage: !page.selector
        });
        
        // Check if baseline exists
        const baselineExists = await fs.access(baselinePath).then(() => true).catch(() => false);
        
        if (!baselineExists) {
          console.log(`⚠️  No baseline found for ${page.name}, creating one...`);
          await fs.copyFile(currentPath, baselinePath);
          results.push({
            page: page.name,
            status: 'baseline_created',
            message: 'Baseline created from current screenshot'
          });
          continue;
        }
        
        // Basic file size comparison (simple diff)
        const currentStats = await fs.stat(currentPath);
        const baselineStats = await fs.stat(baselinePath);
        const sizeDiffPercent = Math.abs(currentStats.size - baselineStats.size) / baselineStats.size * 100;
        
        if (sizeDiffPercent > this.config.thresholdPercent) {
          console.log(`🚨 Visual difference detected in ${page.name} (${sizeDiffPercent.toFixed(2)}% size change)`);
          results.push({
            page: page.name,
            status: 'changed',
            sizeDiffPercent,
            message: `Visual changes detected`
          });
        } else {
          console.log(`✅ No significant changes in ${page.name}`);
          results.push({
            page: page.name,
            status: 'unchanged',
            sizeDiffPercent,
            message: 'No significant visual changes'
          });
        }
        
      } catch (error) {
        console.error(`❌ Failed visual test for ${page.name}:`, error);
        results.push({
          page: page.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Generate report
    await this.generateReport(results);
    
    return results;
  }

  private async generateReport(results: any[]) {
    const reportPath = path.join(this.config.outputDir, 'visual-regression-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed: results.filter(r => r.status === 'unchanged').length,
      changed: results.filter(r => r.status === 'changed').length,
      errors: results.filter(r => r.status === 'error').length,
      baselineCreated: results.filter(r => r.status === 'baseline_created').length,
      results
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Report saved to ${reportPath}`);
  }

  async cleanup() {
    await this.generator.close();
  }
}

// Configuration for your banking app
const config: BaselineConfig = {
  baseUrl: 'http://localhost:5173',
  outputDir: './tests/visual-regression',
  thresholdPercent: 2, // 2% size difference threshold
  pages: [
    { name: 'homepage', url: '/' },
    { name: 'login', url: '/login' },
    { name: 'register', url: '/register' },
    { name: 'dashboard', url: '/dashboard' },
    { name: 'transfer', url: '/transfer' },
    { name: 'admin', url: '/admin' },
    
    // Mobile versions
    { name: 'homepage-mobile', url: '/', viewport: { width: 375, height: 667 } },
    { name: 'login-mobile', url: '/login', viewport: { width: 375, height: 667 } },
    { name: 'dashboard-mobile', url: '/dashboard', viewport: { width: 375, height: 667 } },
    
    // Specific components
    { name: 'navbar', url: '/', selector: 'nav' },
    { name: 'transfer-form', url: '/transfer', selector: 'form' }
  ]
};

// CLI runner
async function main() {
  const command = process.argv[2];
  const tester = new VisualRegressionTester(config);
  
  try {
    switch (command) {
      case 'baseline':
        await tester.generateBaselines();
        break;
      case 'test':
        const results = await tester.runVisualTests();
        const hasChanges = results.some(r => r.status === 'changed');
        process.exit(hasChanges ? 1 : 0);
        break;
      default:
        console.log('Usage: tsx scripts/visual-regression.ts [baseline|test]');
        console.log('  baseline - Generate baseline screenshots');
        console.log('  test     - Run visual regression tests');
        process.exit(1);
    }
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { VisualRegressionTester, BaselineConfig };