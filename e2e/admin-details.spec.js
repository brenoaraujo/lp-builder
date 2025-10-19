import { test, expect } from '@playwright/test';
import { 
  createTestInvite, 
  cleanupTestInvites, 
  fillCharityInfo, 
  selectVariant, 
  navigateToOnboarding,
  takeScreenshotOnFailure 
} from './utils/test-helpers.js';
import { testCharityData, variantSelections } from './fixtures/test-data.js';

test.describe('Admin Details Display Tests', () => {
  let testToken;
  
  test.beforeEach(async ({ page }) => {
    // Create a test invite
    testToken = await createTestInvite(page);
  });
  
  test.afterEach(async ({ page }) => {
    // Clean up test invite
    if (testToken) {
      await cleanupTestInvites(page, [testToken]);
    }
  });

  test('Admin details show all onboarding data', async ({ page }, testInfo) => {
    // Complete onboarding with test data
    await navigateToOnboarding(page, testToken);
    await fillCharityInfo(page);
    await page.click('button:has-text("Continue")');
    
    // Complete hero section
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    await selectVariant(page, 'hero', variantSelections.hero);
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    await page.click('button:has-text("Next")');
    
    // Complete extra prizes section
    await page.waitForSelector('h2:has-text("Choose Extra Prizes Layout")');
    await selectVariant(page, 'extraPrizes', variantSelections.extraPrizes);
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    await page.click('button:has-text("Next")');
    
    // Complete winners section
    await page.waitForSelector('h2:has-text("Choose Winners Layout")');
    await selectVariant(page, 'winners', variantSelections.winners);
    await page.waitForSelector('h2:has-text("Edit Winners Section")');
    await page.click('button:has-text("Next")');
    
    // Skip additional content and go to review
    await page.waitForSelector('h2:has-text("Additional Content")');
    await page.click('button:has-text("Skip")');
    await page.waitForSelector('h2:has-text("Review Your Landing Page")');
    
    // Now test admin details
    // Navigate to admin page
    await page.goto('/admin');
    
    // Login to admin
    await page.fill('input[type="password"]', '112');
    await page.click('button:has-text("Access Admin Panel")');
    
    // Wait for admin panel to load
    await page.waitForSelector('h1:has-text("Admin Panel")');
    
    // Find the test invite row and click details
    const inviteRow = page.locator(`table tbody tr:has-text("${testToken}")`);
    await inviteRow.locator('button:has-text("Details")').click();
    
    // Wait for details sheet to open
    await page.waitForSelector('[role="dialog"]');
    
    // Verify Invite section
    await page.click('button:has-text("Invite")');
    await expect(page.locator('text=' + testCharityData.ascendRepresentative)).toBeVisible();
    await expect(page.locator('text=' + testCharityData.ascendEmail)).toBeVisible();
    
    // Verify Charity section
    await page.click('button:has-text("Logo")');
    // Check if logo is displayed (if uploaded)
    
    // Verify Campaign section
    await page.click('button:has-text("Campaign")');
    await expect(page.locator('text=' + testCharityData.raffleType)).toBeVisible();
    await expect(page.locator('text=' + testCharityData.launchDate)).toBeVisible();
    
    // Verify Ascend section
    await page.click('button:has-text("Ascend Client Services Representative")');
    await expect(page.locator('text=' + testCharityData.ascendRepresentative)).toBeVisible();
    await expect(page.locator('text=' + testCharityData.ascendEmail)).toBeVisible();
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('Layout info displays for all sections', async ({ page }, testInfo) => {
    // Complete onboarding with multiple sections
    await navigateToOnboarding(page, testToken);
    await fillCharityInfo(page);
    await page.click('button:has-text("Continue")');
    
    // Complete all sections with different variants
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    await selectVariant(page, 'hero', variantSelections.hero);
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('h2:has-text("Choose Extra Prizes Layout")');
    await selectVariant(page, 'extraPrizes', variantSelections.extraPrizes);
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    await page.click('button:has-text("Next")');
    
    await page.waitForSelector('h2:has-text("Choose Winners Layout")');
    await selectVariant(page, 'winners', variantSelections.winners);
    await page.waitForSelector('h2:has-text("Edit Winners Section")');
    await page.click('button:has-text("Next")');
    
    // Skip to review
    await page.waitForSelector('h2:has-text("Additional Content")');
    await page.click('button:has-text("Skip")');
    await page.waitForSelector('h2:has-text("Review Your Landing Page")');
    
    // Open admin details
    await page.goto('/admin');
    await page.fill('input[type="password"]', '112');
    await page.click('button:has-text("Access Admin Panel")');
    await page.waitForSelector('h1:has-text("Admin Panel")');
    
    const inviteRow = page.locator(`table tbody tr:has-text("${testToken}")`);
    await inviteRow.locator('button:has-text("Details")').click();
    await page.waitForSelector('[role="dialog"]');
    
    // Check hero section layout
    await page.click('button:has-text("Hero")');
    await expect(page.locator('text=Layout')).toBeVisible();
    // The actual variant should be displayed (e.g., "Layout B")
    
    // Check extra prizes section layout
    await page.click('button:has-text("Extra Prizes")');
    await expect(page.locator('text=Layout')).toBeVisible();
    
    // Check winners section layout
    await page.click('button:has-text("Winners")');
    await expect(page.locator('text=Layout')).toBeVisible();
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('Admin details show correct status progression', async ({ page }, testInfo) => {
    // Start onboarding (should change status to in_progress)
    await navigateToOnboarding(page, testToken);
    await fillCharityInfo(page);
    
    // Check admin panel shows in_progress status
    await page.goto('/admin');
    await page.fill('input[type="password"]', '112');
    await page.click('button:has-text("Access Admin Panel")');
    await page.waitForSelector('h1:has-text("Admin Panel")');
    
    // Find the test invite row
    const inviteRow = page.locator(`table tbody tr:has-text("${testToken}")`);
    
    // Verify status shows as in_progress
    await expect(inviteRow.locator('text=in_progress')).toBeVisible();
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });
});


