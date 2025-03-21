# Klaviyo API Integration Issues and Solutions

## Overview

This document outlines common issues encountered when integrating with the Klaviyo API and their solutions.

## Issue 1: 405 Method Not Allowed Errors

### Problem
When accessing certain endpoints (flows, forms, segments), the API returned 405 (Method Not Allowed) errors, indicating that the HTTP method or endpoint structure was incorrect.

### Solution
1. Updated endpoint paths to match Klaviyo API v2025-01-15 requirements:
   - Changed base URL from 'https://a.klaviyo.com/api' to 'https://a.klaviyo.com'
   - Added 'api/' prefix to all endpoint paths (e.g., 'api/campaigns' instead of 'campaigns')
   - Updated headers with proper case sensitivity ('revision' instead of 'Revision')
   - Added Content-Type header

2. Enhanced error logging to provide more detailed information:
   - Added request URL and header logging
   - Added response status and header logging
   - Enhanced error message formatting

## Issue 2: Incorrect Data Transformation

### Problem
Even when successful API calls were made, the data wasn't properly displayed in the frontend components because:
1. The API response structure didn't match what the frontend expected
2. Some required properties were missing or had different types

### Solution
1. Enhanced the transformation functions to properly map API responses to frontend models
2. Added more robust fallbacks for missing or incorrect data
3. Added validation in UI components to check for required properties
4. Improved error handling and user feedback for data structure issues

## Issue 3: API Key and Metric IDs Configuration

### Problem
The API client wasn't being configured with the correct API key, or the key didn't have the necessary permissions to access all endpoints. Additionally, specific metric IDs were required for revenue and other calculations.

### Solution
1. Ensured the .env file contains a valid Klaviyo API key with proper access rights
   ```
   KLAVIYO_API_KEY=pk_2d109a05c4b7b9bb3b7259ba172e385f2d
   ```
2. Added logging for API key configuration (first few characters only, for security)
3. Configured specific metric IDs for important metrics:
   - Shopify Placed Order Metric ID: `WRfUa5` (used for revenue calculations)
4. Hard-coded important metric IDs in the respective service implementations
5. Verified that the correct API version is being used in headers (`2025-01-15`)

## Issue 4: Understanding the Timeframe Data Requirements

### Problem
The date range parameters weren't being properly formatted or passed to the Klaviyo API, resulting in empty or incorrect data.

### Solution
1. Enhanced date range formatting to match Klaviyo API expectations
2. Added more detailed logging for date range parameters
3. Made sure date ranges are properly passed to all relevant API calls

## Next Steps for Troubleshooting

If issues persist after implementing these solutions:

1. Check your Klaviyo account to ensure it has data for the requested timeframes
2. Review API logs to identify which specific calls are failing
3. Verify your API key has sufficient permissions for all operations
4. Consider setting up a test Klaviyo account with sample data for development
5. Use the [Klaviyo API Reference](https://developers.klaviyo.com/en/reference/api_overview) to ensure endpoint paths and parameters are correct
6. Monitor network requests in the browser to see which specific API calls are failing

## Command for Clearing Cache and Restarting

If you need to clear the cache and restart the application with a fresh state:

```bash
rm -rf backend/.next frontend/.next
./run-with-live-api.sh
```