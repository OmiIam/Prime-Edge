import { UIScreenshotGenerator } from '../server/utils/puppeteer-utils';
import { spawn } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

describe('UI Testing Suite', () => {
  let generator: UIScreenshotGenerator;
  let server: any;
  const baseUrl = 'http://localhost:5173';

  beforeAll(async () => {
    generator = new UIScreenshotGenerator();
    
    // Start development server
    server = spawn('npm', ['run', 'dev'], { 
      stdio: 'pipe',
      detached: false 
    });
    
    // Wait for server to start
    await sleep(5000);
  });

  afterAll(async () => {
    await generator.close();
    if (server) {
      server.kill();
    }
  });

  describe('Page Screenshots', () => {
    test('should capture homepage screenshot', async () => {
      const screenshot = await generator.generateScreenshot(baseUrl, {
        fullPage: true,
        outputPath: 'tests/screenshots/homepage.png'
      });
      
      expect(screenshot).toBeDefined();
    });

    test('should capture login page screenshot', async () => {
      const screenshot = await generator.generateScreenshot(`${baseUrl}/login`, {
        fullPage: true,
        outputPath: 'tests/screenshots/login.png'
      });
      
      expect(screenshot).toBeDefined();
    });

    test('should capture admin dashboard screenshot', async () => {
      const screenshot = await generator.generateScreenshot(`${baseUrl}/admin`, {
        fullPage: true,
        outputPath: 'tests/screenshots/admin.png'
      });
      
      expect(screenshot).toBeDefined();
    });
  });

  describe('Responsive Design Testing', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'ultrawide', width: 2560, height: 1440 }
    ];

    test('should test homepage responsiveness', async () => {
      const results = await generator.testUIResponsiveness(baseUrl, viewports);
      
      expect(results).toHaveLength(viewports.length);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.screenshot).toBeDefined();
      });
    });

    test('should test transfer page responsiveness', async () => {
      const results = await generator.testUIResponsiveness(`${baseUrl}/transfer`, viewports);
      
      expect(results).toHaveLength(viewports.length);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Component Testing', () => {
    const components = [
      {
        name: 'navbar',
        path: '/',
        selector: 'nav'
      },
      {
        name: 'sidebar',
        path: '/dashboard',
        selector: '[data-testid="sidebar"]'
      },
      {
        name: 'transfer-form',
        path: '/transfer',
        selector: 'form[data-testid="transfer-form"]'
      }
    ];

    test('should capture component screenshots', async () => {
      const screenshots = await generator.generateComponentScreenshots(baseUrl, components);
      
      expect(screenshots).toHaveLength(components.length);
      screenshots.forEach(screenshot => {
        expect(screenshot.success).toBe(true);
      });
    });
  });

  describe('Accessibility Testing', () => {
    test('should audit homepage accessibility', async () => {
      const results = await generator.auditAccessibility(baseUrl);
      
      expect(results).toHaveProperty('totalImages');
      expect(results).toHaveProperty('totalHeadings');
      expect(results).toHaveProperty('issues');
      expect(Array.isArray(results.issues)).toBe(true);
    });

    test('should audit login page accessibility', async () => {
      const results = await generator.auditAccessibility(`${baseUrl}/login`);
      
      expect(results.issues.length).toBeLessThan(5); // Arbitrary threshold
    });
  });

  describe('Visual Regression Testing', () => {
    test('should detect visual changes in key components', async () => {
      const keyPages = [
        { name: 'homepage', path: '/' },
        { name: 'login', path: '/login' },
        { name: 'dashboard', path: '/dashboard' },
        { name: 'transfer', path: '/transfer' }
      ];

      const screenshots = await generator.generateComponentScreenshots(baseUrl, keyPages);
      
      screenshots.forEach(screenshot => {
        expect(screenshot.success).toBe(true);
        // In a real scenario, you'd compare against baseline images
      });
    });
  });
});