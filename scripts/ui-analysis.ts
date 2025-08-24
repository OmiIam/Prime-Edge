import { UIScreenshotGenerator } from '../server/utils/puppeteer-utils';
import { promises as fs } from 'fs';
import path from 'path';

interface AnalysisPage {
  name: string;
  url: string;
  description: string;
}

class UIAnalyzer {
  private generator: UIScreenshotGenerator;
  private baseUrl = 'http://localhost:5173';
  private outputDir = './ui-analysis';

  constructor() {
    this.generator = new UIScreenshotGenerator();
  }

  private pages: AnalysisPage[] = [
    { name: 'homepage', url: '/', description: 'Landing page' },
    { name: 'login', url: '/login', description: 'Login form' },
    { name: 'register', url: '/register', description: 'Registration form' },
    { name: 'dashboard', url: '/dashboard', description: 'User dashboard' },
    { name: 'transfer', url: '/transfer', description: 'Money transfer interface' },
    { name: 'admin', url: '/admin', description: 'Admin panel' }
  ];

  async captureComprehensiveScreenshots() {
    console.log('📸 Capturing comprehensive UI screenshots...');
    
    await fs.mkdir(path.join(this.outputDir, 'screenshots'), { recursive: true });
    
    const viewports = [
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];

    const results = [];

    for (const page of this.pages) {
      console.log(`\n📄 Analyzing page: ${page.name} (${page.description})`);
      
      for (const viewport of viewports) {
        const url = `${this.baseUrl}${page.url}`;
        const filename = `${page.name}-${viewport.name}.png`;
        const outputPath = path.join(this.outputDir, 'screenshots', filename);
        
        try {
          await this.generator.generateScreenshot(url, {
            width: viewport.width,
            height: viewport.height,
            fullPage: true,
            outputPath
          });
          
          console.log(`  ✅ ${viewport.name}: ${filename}`);
          results.push({
            page: page.name,
            viewport: viewport.name,
            success: true,
            filename
          });
        } catch (error) {
          console.log(`  ❌ ${viewport.name}: Failed - ${error}`);
          results.push({
            page: page.name,
            viewport: viewport.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  async extractHTMLSnapshots() {
    console.log('\n🔍 Extracting HTML snapshots...');
    
    await fs.mkdir(path.join(this.outputDir, 'html'), { recursive: true });
    
    const browser = await this.generator['initBrowser']();
    
    for (const page of this.pages) {
      const url = `${this.baseUrl}${page.url}`;
      const htmlFile = path.join(this.outputDir, 'html', `${page.name}.html`);
      
      const pageInstance = await browser.newPage();
      
      try {
        await pageInstance.goto(url, { waitUntil: 'networkidle0' });
        
        const htmlContent = await pageInstance.content();
        await fs.writeFile(htmlFile, htmlContent, 'utf8');
        
        console.log(`  ✅ ${page.name}.html extracted`);
      } catch (error) {
        console.log(`  ❌ ${page.name}: Failed - ${error}`);
      } finally {
        await pageInstance.close();
      }
    }
  }

  async performAccessibilityAudit() {
    console.log('\n♿ Running accessibility audits...');
    
    const auditResults = [];
    
    for (const page of this.pages) {
      const url = `${this.baseUrl}${page.url}`;
      
      try {
        const results = await this.generator.auditAccessibility(url);
        auditResults.push({
          page: page.name,
          ...results
        });
        
        console.log(`  ✅ ${page.name}: ${results.issues.length} issues found`);
      } catch (error) {
        console.log(`  ❌ ${page.name}: Audit failed`);
      }
    }
    
    // Save audit results
    const auditFile = path.join(this.outputDir, 'accessibility-audit.json');
    await fs.writeFile(auditFile, JSON.stringify(auditResults, null, 2));
    
    return auditResults;
  }

  async generateAnalysisReport(screenshots: any[], accessibility: any[]) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: this.pages.length,
        totalScreenshots: screenshots.length,
        successfulScreenshots: screenshots.filter(s => s.success).length,
        accessibilityIssues: accessibility.reduce((sum, page) => sum + page.issues.length, 0)
      },
      pages: this.pages.map(page => ({
        name: page.name,
        description: page.description,
        url: page.url,
        screenshots: screenshots.filter(s => s.page === page.name),
        accessibility: accessibility.find(a => a.page === page.name) || null
      })),
      recommendations: {
        criticalIssues: [],
        improvements: [],
        quickWins: []
      }
    };

    const reportFile = path.join(this.outputDir, 'analysis-report.json');
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 Analysis report saved: ${reportFile}`);
    return report;
  }

  async cleanup() {
    await this.generator.close();
  }
}

async function main() {
  const analyzer = new UIAnalyzer();
  
  try {
    console.log('🎯 Starting comprehensive UI/UX analysis...\n');
    
    // Capture screenshots
    const screenshots = await analyzer.captureComprehensiveScreenshots();
    
    // Extract HTML
    await analyzer.extractHTMLSnapshots();
    
    // Run accessibility audits
    const accessibility = await analyzer.performAccessibilityAudit();
    
    // Generate report
    await analyzer.generateAnalysisReport(screenshots, accessibility);
    
    console.log('\n🎉 UI/UX analysis complete!');
    console.log(`📁 Results saved in: ./ui-analysis/`);
    
  } finally {
    await analyzer.cleanup();
  }
}

// Run the analysis
main().catch(console.error);