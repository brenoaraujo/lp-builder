/**
 * Debug helpers for troubleshooting test failures
 */

/**
 * Captures and logs console errors
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<string[]>} - Array of console error messages
 */
export async function captureConsoleErrors(page) {
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return errors;
}

/**
 * Takes a screenshot on test failure
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {import('@playwright/test').TestInfo} testInfo - Test info object
 */
export async function takeScreenshotOnFailure(page, testInfo) {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('screenshot', { 
      body: screenshot, 
      contentType: 'image/png' 
    });
  }
}

/**
 * Dumps React component state for debugging
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Object>} - React component state
 */
export async function dumpState(page) {
  return await page.evaluate(() => {
    // Access React DevTools if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const renderers = hook.renderers;
      
      if (renderers && renderers.size > 0) {
        const renderer = Array.from(renderers.values())[0];
        return {
          hasReactDevTools: true,
          rendererVersion: renderer.version,
          fiberRoots: renderer.getFiberRoots ? Array.from(renderer.getFiberRoots(1)) : []
        };
      }
    }
    
    return {
      hasReactDevTools: false,
      windowKeys: Object.keys(window).filter(key => key.includes('React') || key.includes('react'))
    };
  });
}

/**
 * Logs variant selection flow for debugging
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} sectionKey - The section key being tested
 */
export async function traceVariantSelection(page, sectionKey) {
  const logs = [];
  
  page.on('console', msg => {
    if (msg.text().includes('VariantCarousel') || 
        msg.text().includes('Advance') || 
        msg.text().includes(sectionKey)) {
      logs.push({
        timestamp: new Date().toISOString(),
        text: msg.text(),
        type: msg.type()
      });
    }
  });
  
  return logs;
}

/**
 * Waits for specific network requests to complete
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} urlPattern - URL pattern to match
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForNetworkRequest(page, urlPattern, timeout = 10000) {
  return await page.waitForRequest(request => 
    request.url().includes(urlPattern), 
    { timeout }
  );
}

/**
 * Captures performance metrics
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Object>} - Performance metrics
 */
export async function capturePerformanceMetrics(page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || null,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || null
    };
  });
}

/**
 * Monitors memory usage
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Object>} - Memory usage information
 */
export async function getMemoryUsage(page) {
  return await page.evaluate(() => {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return { memoryAPI: 'not available' };
  });
}

/**
 * Captures all console messages during test execution
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Array>} - Array of all console messages
 */
export async function captureAllConsoleMessages(page) {
  const messages = [];
  
  page.on('console', msg => {
    messages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    });
  });
  
  return messages;
}

/**
 * Waits for React component to be ready
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector for the component
 */
export async function waitForReactComponent(page, selector) {
  await page.waitForSelector(selector);
  
  // Wait for React to finish rendering
  await page.waitForFunction(() => {
    return document.readyState === 'complete';
  });
  
  // Additional wait for React hydration
  await page.waitForTimeout(100);
}


