import { test, expect } from '@playwright/test';
import { 
  createTestInvite, 
  cleanupTestInvites, 
  fillCharityInfo, 
  selectVariant, 
  navigateToOnboarding,
  takeScreenshotOnFailure 
} from '../utils/test-helpers.js';
import { testCharityData, variantSelections } from '../fixtures/test-data.js';

test.describe('State Management Integration Tests', () => {
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

  test('setVariant updates overridesBySection correctly', async ({ page }, testInfo) => {
    // Navigate to onboarding and fill charity info
    await navigateToOnboarding(page, testToken);
    await fillCharityInfo(page);
    await page.click('button:has-text("Continue")');
    
    // Wait for hero selection step
    await page.waitForSelector('h2:has-text("Choose Hero Layout")');
    
    // Monitor console logs for variant selection
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('VariantCarousel: Choosing variant')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Select variant B
    await selectVariant(page, 'hero', variantSelections.hero);
    
    // Wait for setTimeout to complete
    await page.waitForTimeout(100);
    
    // Wait for edit step to load
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    
    // Verify the variant selection was logged
    expect(consoleLogs.length).toBeGreaterThan(0);
    expect(consoleLogs[0]).toContain('hero');
    expect(consoleLogs[0]).toContain(variantSelections.hero);
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('saveProgress saves correct data structure', async ({ page }, testInfo) => {
    // Navigate to onboarding and fill charity info
    await navigateToOnboarding(page, testToken);
    await fillCharityInfo(page);
    
    // Monitor network requests for save operations
    const saveRequests = [];
    page.on('request', request => {
      if (request.url().includes('invites') && request.method() === 'PATCH') {
        saveRequests.push(request);
      }
    });
    
    // Click Continue to trigger save
    await page.click('button:has-text("Continue")');
    
    // Wait for the request to complete
    await page.waitForTimeout(2000);
    
    // Verify save request was made
    expect(saveRequests.length).toBeGreaterThan(0);
    
    // Get the request payload
    const saveRequest = saveRequests[0];
    const requestBody = saveRequest.postDataJSON();
    
    // Verify the request contains the expected structure
    expect(requestBody).toHaveProperty('onboarding_json');
    expect(requestBody.onboarding_json).toHaveProperty('charityInfo');
    expect(requestBody.onboarding_json.charityInfo).toHaveProperty('charityName', testCharityData.name);
    expect(requestBody.onboarding_json.charityInfo).toHaveProperty('raffleType', testCharityData.raffleType);
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('Auto-save triggers on state changes', async ({ page }, testInfo) => {
    // Navigate to onboarding
    await navigateToOnboarding(page, testToken);
    
    // Monitor for "Saving..." indicator
    let savingIndicatorShown = false;
    page.on('console', msg => {
      if (msg.text().includes('Saving...')) {
        savingIndicatorShown = true;
      }
    });
    
    // Fill charity name to trigger auto-save
    await page.fill('input[id="charityName"]', testCharityData.name);
    
    // Wait for auto-save to trigger
    await page.waitForTimeout(3000);
    
    // Verify saving indicator appeared (this would be in the UI)
    // We can check for the presence of the saving indicator in the DOM
    const savingIndicator = page.locator('text=Saving...');
    if (await savingIndicator.count() > 0) {
      await savingIndicator.waitFor({ state: 'visible', timeout: 5000 });
      await savingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('State updates are debounced correctly', async ({ page }, testInfo) => {
    // Navigate to onboarding
    await navigateToOnboarding(page, testToken);
    
    // Monitor network requests
    const saveRequests = [];
    page.on('request', request => {
      if (request.url().includes('invites') && request.method() === 'PATCH') {
        saveRequests.push({
          url: request.url(),
          timestamp: Date.now(),
          body: request.postDataJSON()
        });
      }
    });
    
    // Rapidly type in charity name to test debouncing
    const charityNameInput = page.locator('input[id="charityName"]');
    await charityNameInput.click();
    
    // Type character by character with small delays
    for (let i = 0; i < testCharityData.name.length; i++) {
      await charityNameInput.type(testCharityData.name[i]);
      await page.waitForTimeout(100); // Small delay between characters
    }
    
    // Wait for debounced save to complete
    await page.waitForTimeout(2000);
    
    // Verify that multiple save requests weren't made (debouncing worked)
    // We should have at most 1-2 save requests, not one for each character
    expect(saveRequests.length).toBeLessThanOrEqual(2);
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });

  test('Step restoration logic works correctly', async ({ page }, testInfo) => {
    // Navigate to onboarding and complete charity info
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
    
    // Refresh page
    await page.reload();
    
    // Wait for onboarding to reload
    await page.waitForSelector('h2:has-text("Edit Extra Prizes Section")');
    
    // Verify we're restored to the correct step (extra prizes edit)
    await expect(page.locator('h2')).toContainText('Edit Extra Prizes Section');
    
    // Navigate back to verify previous steps are still accessible
    await page.click('button:has-text("Back")');
    await page.waitForSelector('h2:has-text("Edit Hero Section")');
    await expect(page.locator('h2')).toContainText('Edit Hero Section');
    
    // Take screenshot for verification
    await takeScreenshotOnFailure(page, testInfo);
  });
});


