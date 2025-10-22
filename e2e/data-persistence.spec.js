import { test, expect } from '@playwright/test';
import { 
  createTestInvite, 
  cleanupTestInvites, 
  fillCharityInfo, 
  selectVariant, 
  navigateToOnboarding,
  waitForAutoSave,
  takeScreenshotOnFailure 
} from './utils/test-helpers.js';
import { testCharityData, variantSelections } from './fixtures/test-data.js';

test.describe('Data Persistence Tests', () => {
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

  test('Hero data persists after page refresh', async ({ page }, testInfo) => {
    // Start onboarding and fill charity info
    await navigateToOnboarding(page, testToken);
    await fillCharityInfo(page);
    await page.click('button:has-text("Continue")');
    
    // Complete hero section
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    await selectVariant(page, 'hero', variantSelections.hero);
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    
    // Edit some hero text
    const headlineInput = page.locator('input[data-label="Headline"]');
    if (await headlineInput.count() > 0) {
      await headlineInput.fill('Test Headline After Refresh');
    }
    
    // Wait for auto-save
    await waitForAutoSave(page);
    
    // Refresh page
    await page.reload();
    
    // Wait for onboarding to reload
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    
    // Verify we're still on the hero edit step
    await expect(page.locator('h2')).toContainText('Edit Hero Section');
    
    // Navigate to review to verify data persisted
    await page.click('button:has-text("Next")');
    await page.waitForSelector('h2:has-text("Choose Extra Prizes Layout")');
    await selectVariant(page, 'extraPrizes', 'A'); // Quick selection
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('h2:has-text("Choose Winners Layout")');
    await selectVariant(page, 'winners', 'A'); // Quick selection
    await page.waitForSelector('h2:has-text("Edit Winners Section")');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('h2:has-text("Additional Content")');
    await page.click('button:has-text("Skip")');
    await page.waitForSelector('h2:has-text("Review Your Landing Page")');
    
    // Verify hero data is present in review
    await expect(page.locator('text=' + testCharityData.name)).toBeVisible();
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('All section data persists correctly', async ({ page }, testInfo) => {
    // Complete full onboarding
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
    
    // Skip additional content
    await page.waitForSelector('h2:has-text("Additional Content")');
    await page.click('button:has-text("Skip")');
    
    // Wait for review step
    await page.waitForSelector('h2:has-text("Review Your Landing Page")');
    
    // Refresh at review step
    await page.reload();
    
    // Wait for onboarding to reload
    await page.waitForSelector('h2:has-text("Review Your Landing Page")');
    
    // Verify all data is still present
    await expect(page.locator('text=' + testCharityData.name)).toBeVisible();
    await expect(page.locator('text=' + testCharityData.raffleType)).toBeVisible();
    await expect(page.locator('text=' + testCharityData.ascendRepresentative)).toBeVisible();
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('Step restoration works correctly after refresh', async ({ page }, testInfo) => {
    // Start onboarding and fill charity info
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
    
    // Refresh at extra prizes edit step
    await page.reload();
    
    // Wait for onboarding to reload
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    
    // Verify we're restored to the correct step
    await expect(page.locator('h2')).toContainText('Edit Extra Prizes Section');
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('Multiple refreshes maintain data integrity', async ({ page }, testInfo) => {
    // Start onboarding
    await navigateToOnboarding(page, testToken);
    await fillCharityInfo(page);
    
    // Refresh at charity info step
    await page.reload();
    await page.waitForSelector('h2:has-text("Setup your profile")');
    await expect(page.locator('input[id="charityName"]')).toHaveValue(testCharityData.name);
    
    // Continue and complete hero
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    await selectVariant(page, 'hero', variantSelections.hero);
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    
    // Refresh at hero edit step
    await page.reload();
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    await expect(page.locator('h2')).toContainText('Edit Hero Section');
    
    // Continue to extra prizes
    await page.click('button:has-text("Next")');
    await page.waitForSelector('h2:has-text("Choose Extra Prizes Layout")');
    await selectVariant(page, 'extraPrizes', variantSelections.extraPrizes);
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    
    // Refresh at extra prizes edit step
    await page.reload();
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    await expect(page.locator('h2')).toContainText('Edit Extra Prizes Section');
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });
});




