# E2E Tests for LP Builder

This directory contains comprehensive end-to-end tests for the LP Builder onboarding flow using Playwright.

## Test Coverage

### Core Tests
- **Full Onboarding Flow** (`onboarding-full-flow.spec.js`)
  - Complete onboarding from start to finish
  - Auto-save functionality verification
  - Data persistence across steps

### Regression Tests
- **Variant Selection** (`variant-selection.spec.js`)
  - Hero variant B selection persists to edit step
  - Extra Prizes variant selection timing
  - All sections maintain correct variants
  - Race condition testing with rapid clicking

- **Admin Details** (`admin-details.spec.js`)
  - Admin details show all onboarding data
  - Layout info displays for all sections
  - Status progression verification

- **Data Persistence** (`data-persistence.spec.js`)
  - Hero data persists after page refresh
  - All section data persists correctly
  - Step restoration works correctly
  - Multiple refreshes maintain data integrity

### Integration Tests
- **State Management** (`integration/state-management.spec.js`)
  - setVariant updates overridesBySection correctly
  - saveProgress saves correct data structure
  - Auto-save triggers on state changes
  - State updates are debounced correctly
  - Step restoration logic works correctly

## Running Tests

### Prerequisites
1. Make sure the development server is running: `npm run dev`
2. Ensure you have valid Supabase credentials in your `.env` file
3. Make sure the admin password is set to `112` (or update test helpers)

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/variant-selection.spec.js

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
```

### Advanced Commands

```bash
# Run tests with specific pattern
npx playwright test --grep "variant selection"

# Run tests with retries
npx playwright test --retries=3

# Generate test report
npx playwright show-report

# Update test snapshots
npx playwright test --update-snapshots
```

## Test Structure

### Test Data
- `fixtures/test-data.js` - Contains sample data for tests
- `utils/test-helpers.js` - Helper functions for common operations

### Debug Helpers
- `debug-helpers.js` - Utilities for debugging test failures
- Console error capture
- Screenshot on failure
- Performance monitoring
- Memory usage tracking

## Key Test Scenarios

### 1. Variant Selection Race Condition
Tests the setTimeout fix that prevents variant A from showing when variant B is selected:

```javascript
// Select variant B
await selectVariant(page, 'hero', 'B');

// Wait for setTimeout to complete
await page.waitForTimeout(100);

// Verify edit step shows variant B
await expect(page.locator('h2')).toContainText('Edit Hero Section');
```

### 2. Auto-save Functionality
Verifies that data is automatically saved and persists across page refreshes:

```javascript
// Fill form data
await fillCharityInfo(page);

// Wait for auto-save
await waitForAutoSave(page);

// Refresh page
await page.reload();

// Verify data persists
await expect(page.locator('input[id="charityName"]')).toHaveValue(testCharityData.name);
```

### 3. Admin Details Display
Ensures all onboarding data is correctly displayed in the admin panel:

```javascript
// Complete onboarding
// ... (complete flow)

// Open admin details
await page.goto('/admin');
// ... (login and open details)

// Verify all sections show correct data
await expect(page.locator('text=' + testCharityData.name)).toBeVisible();
```

## Troubleshooting

### Common Issues

1. **Tests fail with "Element not found"**
   - Ensure the dev server is running on `http://localhost:5173`
   - Check that the onboarding flow is working manually
   - Verify test selectors are correct

2. **Admin login fails**
   - Ensure admin password is set to `112` in your environment
   - Check that admin panel is accessible manually

3. **Variant selection tests fail**
   - This indicates the setTimeout fix may not be working
   - Check console logs for timing issues
   - Verify `overridesBySection` state is updating correctly

4. **Data persistence tests fail**
   - Check Supabase connection and credentials
   - Verify auto-save is working in the UI
   - Check database for saved data

### Debug Mode
Run tests in debug mode to step through them:

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests line by line
- Inspect elements
- View console logs
- Take screenshots at any point

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots on failure
- Video recordings
- Console logs
- Network requests

View these in the test report:
```bash
npx playwright show-report
```

## Test Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Import helper functions from `utils/test-helpers.js`
3. Use test data from `fixtures/test-data.js`
4. Follow existing patterns for setup/teardown

### Updating Selectors
If UI changes, update selectors in:
- `utils/test-helpers.js` - Common selectors
- Individual test files - Specific selectors

### Performance Monitoring
Tests include performance monitoring to catch:
- Slow page loads
- Memory leaks
- Excessive network requests
- Long-running operations

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    npm install
    npm run build
    npm run test:e2e
```

## Best Practices

1. **Test Isolation**: Each test creates and cleans up its own test data
2. **Realistic Data**: Use realistic test data that matches production
3. **Error Handling**: Tests include proper error handling and cleanup
4. **Performance**: Tests monitor performance and catch regressions
5. **Documentation**: Tests are self-documenting with clear descriptions


