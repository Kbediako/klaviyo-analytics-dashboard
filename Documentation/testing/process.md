# Testing Process Documentation

## Overview

This document outlines the testing process for the Klaviyo Analytics Dashboard, including unit tests, integration tests, and end-to-end tests.

## Test Types

### 1. Unit Tests
- Located in `__tests__` directories alongside source files
- Test individual components and functions
- Run using Jest/Vitest
- Focus on isolated functionality

### 2. Integration Tests
- Test interaction between components
- Verify API integration points
- Check data flow through the application
- Located in `backend/src/tests`

### 3. End-to-End Tests
- Test complete user workflows
- Verify frontend and backend integration
- Located in `public/` directory
- Run in browser using Mocha/Chai

## Date Range Testing

### Test Coverage

The date range tests verify:

1. **Standard Date Ranges**
   - Last 7 days
   - Last 30 days (default)
   - Last 90 days
   - Data consistency across components

2. **Custom Date Ranges**
   - Year boundary transitions
   - Single day selections
   - Invalid date formats
   - Future dates

3. **Component Updates**
   - Overview metrics
   - Campaign data
   - Charts and visualizations
   - Loading states

4. **Error Handling**
   - Invalid date formats
   - Future dates
   - API errors
   - UI error messages

### Running Date Range Tests

1. Start the development server:
```bash
npm run dev
```

2. Open the test runner:
```bash
open public/test-runner.html
```

3. Monitor test results in the browser
   - Check console for detailed logs
   - Verify all test cases pass
   - Review error messages if any

### Test Files

- `public/mock-date-ranges.js`: Mock data for different date ranges
- `public/date-range-test.js`: E2E tests for date range functionality
- `public/e2e-test.js`: General E2E tests including date range integration

## Pre-Live API Testing

Before switching to live Klaviyo API:

1. Run all mock tests:
   ```bash
   npm run test:e2e
   ```

2. Verify date range handling:
   - Check all standard ranges
   - Test custom date selections
   - Verify error handling

3. Document test results:
   - Screenshot test outcomes
   - Note any failed cases
   - Document error scenarios

4. Compare with API documentation:
   - Verify date format alignment
   - Check response structure
   - Confirm error handling matches

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run E2E tests
        run: npm run test:e2e
```

### Test Requirements

1. All tests must pass before merge
2. Date range tests are mandatory
3. Test results must be documented
4. Failed tests block deployment

## Maintaining Tests

### Best Practices

1. Keep tests up to date:
   - Update when adding features
   - Maintain mock data accuracy
   - Document new test cases

2. Regular test review:
   - Check for obsolete tests
   - Update expected results
   - Verify error scenarios

3. Performance monitoring:
   - Track test execution time
   - Optimize slow tests
   - Monitor resource usage

### Documentation

1. Update test documentation:
   - New test cases
   - Changed behaviors
   - Modified expectations

2. Maintain examples:
   - Keep code snippets current
   - Update screenshots
   - Review error messages

## Browser-Based Testing

### Using Browser Actions

When testing the application using browser automation tools or browser actions:

1. **Always scroll to see the full application**:
   - Scroll all the way up and down to check the entire page
   - The default browser window size (900x600) may not show all UI elements
   - Navigation tabs and important controls may be below the fold
   - Some interactive elements might only be visible after scrolling
   - **IMPORTANT**: Always scroll after clicking on tabs to see tab content

2. **Check for responsive behavior**:
   - Test at different viewport sizes
   - Verify that UI elements reflow correctly
   - Ensure navigation remains accessible

3. **Verify tab navigation**:
   - Tabs may be positioned at different locations based on viewport size
   - Ensure all tabs are accessible and functional
   - Check that tab content loads correctly
   - **IMPORTANT**: Scroll down after tab navigation to see the full content

4. **Monitor console output**:
   - Watch for errors and warnings
   - Check for failed API requests
   - Verify data loading indicators

### Best Practices

1. Take screenshots of the full page when testing
2. Use explicit waits for content to load
3. Verify both visible and non-visible (scrolled) content
4. Test interactions with elements that require scrolling to access
5. Follow the detailed guidelines in [Browser Action Testing Best Practices](./browser-action-testing.md)
6. Use the demo script at `scripts/browser-action-demo.js` as a reference implementation

### Demo Script

A demonstration script is available at `scripts/browser-action-demo.js` that shows how to properly test the UI with scrolling:

```bash
# Install puppeteer if not already installed
npm install puppeteer

# Run the demo script
node scripts/browser-action-demo.js
```

This script demonstrates:
- Proper viewport configuration (900x600)
- Launching the application
- Scrolling to see content below the fold
- Clicking on tabs and scrolling to see tab content
- Taking screenshots at each step for verification

## Troubleshooting

### Common Issues

1. Failed date range tests:
   - Check date format consistency
   - Verify mock data structure
   - Review error handling

2. Inconsistent results:
   - Check test isolation
   - Verify setup/teardown
   - Review async operations

3. Browser compatibility:
   - Test in multiple browsers
   - Check date parsing
   - Verify DOM interactions

4. Visibility issues:
   - Elements may be out of viewport (scroll required)
   - Check z-index for overlapping elements
   - Verify CSS media queries for responsive views

### Resolution Steps

1. Isolate the issue:
   - Run specific test suites
   - Check console logs
   - Review network requests

2. Update tests:
   - Fix broken assertions
   - Update mock data
   - Adjust timeouts

3. Document fixes:
   - Note root causes
   - Document solutions
   - Update test cases
