# Debug Workflow Documentation

This document explains how to use the enhanced debugging workflow for the Klaviyo Analytics Dashboard. The debug workflow provides advanced testing, reporting, and debugging capabilities to help identify and resolve issues quickly.

## Overview

The debug workflow (`debug.yml`) is a GitHub Actions workflow that can be:

1. Manually triggered for on-demand debugging
2. Automatically triggered on pull requests and pushes to specific branches
3. Scheduled to run weekly for regular testing

The workflow includes:
- Enhanced test reporting
- Browser testing with screenshots
- Database validation tests
- Performance testing with Lighthouse
- Detailed logging and error reporting

## Triggering the Workflow

### Manual Trigger

To manually trigger the debug workflow:

1. Go to the GitHub repository
2. Click on "Actions" tab
3. Select "Debug Workflow" from the list of workflows
4. Click "Run workflow" button
5. Configure the options:
   - **Branch**: Select the branch to debug (default: develop)
   - **Verbose logging**: Enable for more detailed logs (default: true)
   - **Test scope**: Select which tests to run (default: full)
6. Click "Run workflow" to start

### Automatic Triggers

The workflow automatically runs on:

- **Pull Requests**: When PRs are opened, synchronized, or reopened to `main` or `develop` branches
- **Pushes**: When code is pushed to `main`, `develop`, or any branch starting with `feature/` or `bugfix/`
- **Schedule**: Every Monday at midnight UTC

## Test Scopes

The workflow supports different test scopes:

- **full**: Run all tests (backend, frontend, database, API)
- **backend**: Run only backend tests
- **frontend**: Run only frontend tests
- **database**: Run only database validation tests
- **api**: Run only API tests

## Test Reports and Artifacts

After the workflow completes, you can access:

1. **Test Reports**: JUnit XML and HTML reports for backend tests
2. **Screenshots**: Browser test screenshots showing UI at different stages
3. **Performance Reports**: Lighthouse performance metrics and recommendations
4. **Console Logs**: Detailed logs from test execution

To access these artifacts:

1. Go to the completed workflow run
2. Click on the "Artifacts" section
3. Download the desired artifacts

## Browser Testing

The browser tests use Puppeteer to:

1. Navigate through the application
2. Take screenshots at each step
3. Verify UI elements are visible and functional
4. Collect performance metrics

The tests follow the best practices outlined in the [Browser Action Testing](./browser-action-testing.md) documentation, including proper scrolling to ensure all UI elements are visible.

## Database Validation

The database tests verify:

1. **Schema Validation**: Ensures the database schema matches expectations
2. **Data Integrity**: Validates relationships, constraints, and data values
3. **API Compatibility**: Confirms the database structure supports API requirements

## Performance Testing

Performance testing uses Lighthouse CI to:

1. Measure key performance metrics (FCP, LCP, CLS, etc.)
2. Check accessibility compliance
3. Verify SEO best practices
4. Identify performance bottlenecks

## Debugging Failed Tests

When tests fail, the workflow provides detailed information to help diagnose issues:

1. **Error Messages**: Specific error messages are displayed in the workflow logs
2. **Screenshots**: For browser tests, screenshots show the UI state when the error occurred
3. **Test Reports**: HTML reports highlight which tests failed and why
4. **Console Logs**: Browser console logs capture JavaScript errors

## Adding Custom Tests

You can extend the debug workflow with custom tests:

### Adding Browser Tests

Modify `scripts/ci-browser-tests.js` to add new browser tests:

```javascript
// Test X: New test description
try {
  const testStartTime = Date.now();
  console.log('Test X: Description...');
  
  // Test code here
  
  addTestResult('Test name', 'passed', Date.now() - testStartTime);
} catch (error) {
  console.error('Test X failed:', error);
  await page.screenshot({ path: 'screenshots/X-error.png' });
  addTestResult('Test name', 'failed', Date.now() - testStartTime, error);
}
```

### Adding Database Tests

Add new tests to `scripts/db-test-scripts/db-schema.test.js` or `scripts/db-test-scripts/data-integrity.test.js`:

```javascript
// Test new feature
test('description of test', async () => {
  const result = await pool.query('YOUR QUERY HERE');
  
  // Assertions
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0].column).toBe('expected value');
});
```

## Best Practices

1. **Run locally first**: Before pushing changes, run tests locally to catch issues early
2. **Check test reports**: Always review test reports to understand failures
3. **Use verbose logging**: Enable verbose logging for detailed debugging information
4. **Review screenshots**: For UI issues, check the browser test screenshots
5. **Verify database tests**: Ensure database tests pass with both mock and real data

## Troubleshooting

### Common Issues

1. **Browser tests fail**: Check if the UI structure changed or if elements are not visible
2. **Database tests fail**: Verify the database schema matches expectations
3. **Performance tests fail**: Look for performance regressions in recent changes
4. **API tests fail**: Check if API endpoints or response formats changed

### Resolution Steps

1. **Review logs**: Check the workflow logs for specific error messages
2. **Examine screenshots**: Look at browser test screenshots to see the UI state
3. **Run locally**: Try to reproduce the issue locally for faster debugging
4. **Isolate changes**: Identify which changes caused the tests to fail
