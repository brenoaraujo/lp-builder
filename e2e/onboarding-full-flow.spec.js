import { test, expect } from '@playwright/test';
import { 
  createTestInvite, 
  cleanupTestInvites, 
  waitForAutoSave, 
  fillCharityInfo, 
  selectVariant, 
  navigateToOnboarding,
  takeScreenshotOnFailure 
} from './utils/test-helpers.js';
import { testCharityData, variantSelections, sampleCopyTexts } from './fixtures/test-data.js';

test.describe('Complete Onboarding Flow', () => {
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

  test('Complete onboarding flow with all sections', async ({ page }, testInfo) => {
    // Navigate to onboarding
    await navigateToOnboarding(page, testToken);
    
    // Fill charity info
    await fillCharityInfo(page);
    
    // Click Continue to proceed to hero selection
    await page.click('button:has-text("Continue")');
    
    // Wait for hero selection step
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    
    // Select Hero variant B
    await selectVariant(page, 'hero', variantSelections.hero);
    
    // Wait for edit step to load
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    
    // Verify we're on the hero edit step and variant B is shown
    await expect(page.locator('h2')).toContainText('Edit Hero Section');
    
    // Edit hero text
    const headlineInput = page.locator('input[data-label="Headline"]');
    if (await headlineInput.count() > 0) {
      await headlineInput.fill(sampleCopyTexts.hero.headline);
    }
    
    // Click Next to proceed to extra prizes
    await page.click('button:has-text("Next")');
    
    // Wait for extra prizes selection step
    await page.waitForSelector('h2:has-text("Choose Extra Prizes Layout")');
    
    // Select Extra Prizes variant C
    await selectVariant(page, 'extraPrizes', variantSelections.extraPrizes);
    
    // Wait for edit step to load
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    
    // Verify we're on the extra prizes edit step
    await expect(page.locator('h2')).toContainText('Edit Extra Prizes Section');
    
    // Click Next to proceed to winners
    await page.click('button:has-text("Next")');
    
    // Wait for winners selection step
    await page.waitForSelector('h2:has-text("Choose Winners Layout")');
    
    // Select Winners variant A
    await selectVariant(page, 'winners', variantSelections.winners);
    
    // Wait for edit step to load
    await page.waitForSelector('h2:has-text("Edit Winners Section")');
    
    // Verify we're on the winners edit step
    await expect(page.locator('h2')).toContainText('Edit Winners Section');
    
    // Click Next to proceed to additional content
    await page.click('button:has-text("Next")');
    
    // Wait for additional content step
    await page.waitForSelector('h2:has-text("Additional Content")');
    
    // Skip additional content
    await page.click('button:has-text("Skip")');
    
    // Wait for review step
    await page.waitForSelector('h2:has-text("Review Your Landing Page")');
    
    // Verify review step shows all entered data
    await expect(page.locator('text=' + testCharityData.name)).toBeVisible();
    await expect(page.locator('text=' + testCharityData.raffleType)).toBeVisible();
    await expect(page.locator('text=' + testCharityData.ascendRepresentative)).toBeVisible();
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('Auto-save functionality', async ({ page }, testInfo) => {
    // Navigate to onboarding
    await navigateToOnboarding(page, testToken);
    
    // Fill charity name
    await page.fill('input[id="charityName"]', testCharityData.name);
    
    // Wait for auto-save
    await waitForAutoSave(page);
    
    // Refresh page
    await page.reload();
    
    // Wait for onboarding to reload
    await page.waitForSelector('h2:has-text("Setup your profile")');
    
    // Verify charity name persists
    await expect(page.locator('input[id="charityName"]')).toHaveValue(testCharityData.name);
    
    // Fill remaining required fields and proceed
    await page.fill('input[id="charitySite"]', testCharityData.website);
    await page.click('button:has-text("Select raffle type")');
    await page.click(`text=${testCharityData.raffleType}`);
    
    // Click Continue
    await page.click('button:has-text("Continue")');
    
    // Wait for hero selection step
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    
    // Select hero variant
    await selectVariant(page, 'hero', variantSelections.hero);
    
    // Wait for auto-save
    await waitForAutoSave(page);
    
    // Refresh page
    await page.reload();
    
    // Wait for onboarding to reload
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    
    // Verify we're on the correct step (hero edit)
    await expect(page.locator('h2')).toContainText('Edit Hero Section');
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });
});


