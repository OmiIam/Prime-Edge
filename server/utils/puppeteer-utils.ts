import puppeteer, { Browser, Page } from 'puppeteer';

export class UIScreenshotGenerator {
  private browser: Browser | null = null;

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async generateScreenshot(url: string, options: {
    width?: number;
    height?: number;
    fullPage?: boolean;
    selector?: string;
    outputPath?: string;
  } = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({
        width: options.width || 1920,
        height: options.height || 1080
      });

      await page.goto(url, { waitUntil: 'networkidle0' });

      const screenshotOptions: any = {
        fullPage: options.fullPage || false,
        type: 'png'
      };

      if (options.outputPath) {
        screenshotOptions.path = options.outputPath;
      }

      let screenshot;
      if (options.selector) {
        const element = await page.$(options.selector);
        if (element) {
          screenshot = await element.screenshot(screenshotOptions);
        } else {
          throw new Error(`Element with selector ${options.selector} not found`);
        }
      } else {
        screenshot = await page.screenshot(screenshotOptions);
      }

      return screenshot;
    } finally {
      await page.close();
    }
  }

  async generateComponentScreenshots(baseUrl: string, components: Array<{
    name: string;
    path: string;
    selector?: string;
    viewport?: { width: number; height: number };
  }>) {
    const screenshots = [];

    for (const component of components) {
      try {
        const screenshot = await this.generateScreenshot(`${baseUrl}${component.path}`, {
          width: component.viewport?.width,
          height: component.viewport?.height,
          selector: component.selector,
          outputPath: `screenshots/${component.name}.png`
        });
        screenshots.push({
          name: component.name,
          screenshot,
          success: true
        });
      } catch (error) {
        screenshots.push({
          name: component.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    return screenshots;
  }

  async testUIResponsiveness(url: string, viewports: Array<{ name: string; width: number; height: number }>) {
    const browser = await this.initBrowser();
    const results = [];

    for (const viewport of viewports) {
      const page = await browser.newPage();
      try {
        await page.setViewport(viewport);
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        const screenshot = await page.screenshot({
          fullPage: false,
          type: 'png'
        });

        results.push({
          viewport: viewport.name,
          width: viewport.width,
          height: viewport.height,
          screenshot,
          success: true
        });
      } catch (error) {
        results.push({
          viewport: viewport.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      } finally {
        await page.close();
      }
    }

    return results;
  }

  async auditAccessibility(url: string) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Basic accessibility checks
      const results = await page.evaluate(() => {
        const issues = [];
        
        // Check for missing alt attributes on images
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (!img.alt) {
            issues.push(`Image ${index + 1} missing alt attribute`);
          }
        });

        // Check for proper heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        headings.forEach((heading) => {
          const currentLevel = parseInt(heading.tagName[1]);
          if (currentLevel > previousLevel + 1) {
            issues.push(`Heading hierarchy issue: ${heading.tagName} follows h${previousLevel}`);
          }
          previousLevel = currentLevel;
        });

        // Check for form labels
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
        inputs.forEach((input, index) => {
          const hasLabel = input.labels?.length > 0 || input.getAttribute('aria-label') || input.getAttribute('placeholder');
          if (!hasLabel) {
            issues.push(`Input ${index + 1} missing label or aria-label`);
          }
        });

        return {
          totalImages: images.length,
          totalHeadings: headings.length,
          totalInputs: inputs.length,
          issues
        };
      });

      return results;
    } finally {
      await page.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Utility function for quick screenshots
export async function quickScreenshot(url: string, outputPath?: string) {
  const generator = new UIScreenshotGenerator();
  try {
    const screenshot = await generator.generateScreenshot(url, {
      fullPage: true,
      outputPath
    });
    return screenshot;
  } finally {
    await generator.close();
  }
}