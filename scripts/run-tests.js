#!/usr/bin/env node

/**
 * Test runner script for E2E tests
 * Usage: node scripts/run-tests.js [test-suite]
 * 
 * Available test suites:
 * - full-flow: Complete onboarding flow tests
 * - variants: Variant selection regression tests
 * - admin: Admin details display tests
 * - persistence: Data persistence tests
 * - integration: State management integration tests
 * - all: Run all tests (default)
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const testSuites = {
  'full-flow': 'e2e/onboarding-full-flow.spec.js',
  'variants': 'e2e/variant-selection.spec.js',
  'admin': 'e2e/admin-details.spec.js',
  'persistence': 'e2e/data-persistence.spec.js',
  'integration': 'e2e/integration/state-management.spec.js',
  'all': 'e2e'
};

const testSuite = process.argv[2] || 'all';

if (!testSuites[testSuite]) {
  console.error(`❌ Unknown test suite: ${testSuite}`);
  console.error(`Available suites: ${Object.keys(testSuites).join(', ')}`);
  process.exit(1);
}

const testPath = testSuites[testSuite];

console.log(`🧪 Running ${testSuite} tests...`);
console.log(`📁 Test path: ${testPath}`);
console.log('');

try {
  // Change to project root directory
  process.chdir(projectRoot);
  
  // Run the tests
  const command = `npx playwright test ${testPath}`;
  console.log(`🚀 Executing: ${command}`);
  console.log('');
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: projectRoot
  });
  
  console.log('');
  console.log('✅ Tests completed successfully!');
  
} catch (error) {
  console.error('');
  console.error('❌ Tests failed!');
  console.error('');
  console.error('💡 Tips:');
  console.error('  - Make sure the dev server is running: npm run dev');
  console.error('  - Check that Supabase credentials are configured');
  console.error('  - Verify admin password is set to "112"');
  console.error('  - Run with --debug flag for detailed debugging: npx playwright test --debug');
  console.error('');
  process.exit(1);
}






