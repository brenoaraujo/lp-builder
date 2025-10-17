import { testCharityData, testContactData, testInviteData } from '../fixtures/test-data.js';

/**
 * Creates a test invite via the admin API
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<string>} - The invite token
 */
export async function createTestInvite(page) {
  // Navigate to admin page
  await page.goto('/admin');
  
  // Login to admin
  await page.fill('input[type="password"]', '112');
  await page.click('button:has-text("Access Admin Panel")');
  
  // Wait for admin panel to load
  await page.waitForSelector('h1:has-text("Admin Panel")');
  
  // Create new invite
  await page.click('button:has-text("Create New Invite")');
  
  // Fill invite form
  await page.fill('input[name="contact_name"]', testContactData.name);
  await page.fill('input[name="contact_email"]', testContactData.email);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for invite to be created and get the token
  await page.waitForSelector('table tbody tr');
  const tokenCell = page.locator('table tbody tr:first-child td:first-child');
  const token = await tokenCell.textContent();
  
  return token.trim();
}

/**
 * Cleans up test invites by deleting them
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string[]} tokens - Array of invite tokens to delete
 */
export async function cleanupTestInvites(page, tokens) {
  if (!tokens || tokens.length === 0) return;
  
  // Navigate to admin page
  await page.goto('/admin');
  
  // Login to admin
  await page.fill('input[type="password"]', '112');
  await page.click('button:has-text("Access Admin Panel")');
  
  // Wait for admin panel to load
  await page.waitForSelector('h1:has-text("Admin Panel")');
  
  // Delete each token
  for (const token of tokens) {
    try {
      // Find the row with this token
      const row = page.locator(`table tbody tr:has-text("${token}")`);
      if (await row.count() > 0) {
        // Click delete button for this row
        await row.locator('button:has-text("Delete")').click();
        
        // Confirm deletion
        await page.click('button:has-text("Confirm")');
        
        // Wait for deletion to complete
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.warn(`Failed to delete invite ${token}:`, error);
    }
  }
}

/**
 * Waits for the auto-save indicator to appear and disappear
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function waitForAutoSave(page) {
  // Wait for "Saving..." to appear
  await page.waitForSelector('text=Saving...', { timeout: 5000 });
  
  // Wait for "Saving..." to disappear
  await page.waitForSelector('text=Saving...', { state: 'hidden', timeout: 10000 });
}

/**
 * Returns the variant label for display
 * @param {string} variant - The variant key (A, B, C, etc.)
 * @returns {string} - Formatted label like "Layout A", "Layout B"
 */
export function getVariantLabel(variant) {
  return `Layout ${variant}`;
}

/**
 * Fills the charity info form with test data
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function fillCharityInfo(page) {
  // Fill charity name
  await page.fill('input[id="charityName"]', testCharityData.name);
  
  // Fill website
  await page.fill('input[id="charitySite"]', testCharityData.website);
  
  // Select raffle type
  await page.click('button:has-text("Select raffle type")');
  await page.click(`text=${testCharityData.raffleType}`);
  
  // Fill launch date
  await page.fill('input[id="campaignLaunchDate"]', testCharityData.launchDate);
  
  // Fill ascend representative name
  await page.fill('input[id="ascendRepresentative"]', testCharityData.ascendRepresentative);
  
  // Fill ascend representative email
  await page.fill('input[id="ascendEmail"]', testCharityData.ascendEmail);
}

/**
 * Selects a variant for a given section
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} sectionKey - The section key (hero, extraPrizes, winners)
 * @param {string} variant - The variant to select (A, B, C)
 */
export async function selectVariant(page, sectionKey, variant) {
  // Find the variant button and click it
  const variantButton = page.locator(`[data-section="${sectionKey}"] button:has-text("${variant}")`);
  await variantButton.click();
  
  // Wait for the setTimeout to complete (50ms + buffer)
  await page.waitForTimeout(100);
}

/**
 * Navigates to the onboarding URL with a token
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} token - The invite token
 */
export async function navigateToOnboarding(page, token) {
  await page.goto(`/?token=${token}`);
  
  // Wait for onboarding to load
  await page.waitForSelector('h2:has-text("Setup your profile")');
}

/**
 * Captures console errors for debugging
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<string[]>} - Array of console error messages
 */
export async function captureConsoleErrors(page) {
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
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
    const screenshot = await page.screenshot();
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
  }
}

