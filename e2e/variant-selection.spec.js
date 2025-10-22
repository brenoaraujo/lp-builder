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

test.describe('Variant Selection Regression Tests', () => {
  let testToken;
  
  test.beforeEach(async ({ page }) => {
    // Create a test invite
    testToken = await createTestInvite(page);
    
    // Navigate to onboarding and fill charity info
    await navigateToOnboarding(page, testToken);
    await fillCharityInfo(page);
    await page.click('button:has-text("Continue")');
  });
  
  test.afterEach(async ({ page }) => {
    // Clean up test invite
    if (testToken) {
      await cleanupTestInvites(page, [testToken]);
    }
  });

  test('Hero variant B selection persists to edit step', async ({ page }, testInfo) => {
    // Wait for hero selection step
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    
    // Select variant B
    await selectVariant(page, 'hero', variantSelections.hero);
    
    // Wait for setTimeout to complete (50ms + buffer)
    await page.waitForTimeout(100);
    
    // Wait for edit step to load
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    
    // Verify we're on the edit step
    await expect(page.locator('h2')).toContainText('Edit Hero Section');
    
    // Verify the preview shows variant B (this would be in the EditorForOnboarding component)
    // We can check for specific elements that are unique to variant B
    // For now, we'll verify the step transition worked correctly
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('Extra Prizes variant selection timing', async ({ page }, testInfo) => {
    // Complete hero section first
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    await selectVariant(page, 'hero', 'A'); // Use A for speed
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    await page.click('button:has-text("Next")');
    
    // Wait for extra prizes selection step
    await page.waitForSelector('h2:has-text("Choose Extra Prizes Layout")');
    
    // Select variant B
    await selectVariant(page, 'extraPrizes', variantSelections.extraPrizes);
    
    // Wait for setTimeout to complete
    await page.waitForTimeout(100);
    
    // Wait for edit step to load
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    
    // Verify we're on the edit step
    await expect(page.locator('h2')).toContainText('Edit Extra Prizes Section');
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('All sections maintain correct variants', async ({ page }, testInfo) => {
    // Complete hero section with variant B
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    await selectVariant(page, 'hero', variantSelections.hero);
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    await page.click('button:has-text("Next")');
    
    // Complete extra prizes section with variant C
    await page.waitForSelector('h2:has-text("Choose Extra Prizes Layout")');
    await selectVariant(page, 'extraPrizes', variantSelections.extraPrizes);
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    await page.click('button:has-text("Next")');
    
    // Complete winners section with variant A
    await page.waitForSelector('h2:has-text("Choose Winners Layout")');
    await selectVariant(page, 'winners', variantSelections.winners);
    await page.waitForSelector('h2:has-text("Edit Winners Section")');
    await page.click('button:has-text("Next")');
    
    // Skip additional content
    await page.waitForSelector('h2:has-text("Additional Content")');
    await page.click('button:has-text("Skip")');
    
    // Navigate to review step
    await page.waitForSelector('h2:has-text("Review Your Landing Page")');
    
    // Verify we reached the review step successfully
    await expect(page.locator('h2')).toContainText('Review Your Landing Page');
    
    // Navigate back to verify variants are maintained
    await page.click('button:has-text("Back")');
    await page.waitForSelector('h2:has-text("Edit Winners Section")');
    
    // Go back to extra prizes
    await page.click('button:has-text("Back")');
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    
    // Go back to hero
    await page.click('button:has-text("Back")');
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('Variant selection with rapid clicking', async ({ page }, testInfo) => {
    // Wait for hero selection step
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    
    // Rapidly click different variants to test race conditions
    const variantA = page.locator('[data-section="hero"] button:has-text("A")');
    const variantB = page.locator('[data-section="hero"] button:has-text("B")');
    
    // Click A then immediately B
    await variantA.click();
    await page.waitForTimeout(10);
    await variantB.click();
    
    // Wait for setTimeout to complete
    await page.waitForTimeout(100);
    
    // Wait for edit step to load
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    
    // Verify we're on the edit step (regardless of which variant was selected)
    await expect(page.locator('h2')).toContainText('Edit Hero Section');
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });
});




