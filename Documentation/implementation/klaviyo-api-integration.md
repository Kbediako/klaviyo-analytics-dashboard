# Klaviyo API Integration Guide

## Overview

This document provides detailed information about integrating the Klaviyo Analytics Dashboard with the Klaviyo API, including API key setup, specific metric IDs, and troubleshooting common issues.

## API Configuration

### API Key

The dashboard requires a valid Klaviyo API key with appropriate permissions to access metrics, profiles, campaigns, and events data.

**Current API Key Configuration:**
- Klaviyo API Key: `pk_2d109a05c4b7b9bb3b7259ba172e385f2d`
- This key should be stored in the `/backend/.env` file:

```env
KLAVIYO_API_KEY=pk_2d109a05c4b7b9bb3b7259ba172e385f2d
KLAVIYO_API_VERSION=2025-01-15
PORT=3001
DEBUG=true
```

### Important Metric IDs

The dashboard requires specific Klaviyo metric IDs to retrieve data. Unlike most APIs, Klaviyo does not allow querying metrics by name - you must use their specific IDs:

- **Shopify Placed Order Metric ID:** `WRfUa5`
  - Used in `overviewService.ts` to calculate revenue metrics
  - This is pre-configured in the code for convenience

For other metrics, the system attempts to find appropriate metric IDs by:
1. Retrieving all available metrics from the `/api/metrics` endpoint
2. Scanning for metrics with relevant names (e.g., "Opened Email", "Clicked Email")
3. Extracting the IDs of these metrics for use in subsequent API calls

**Important**: Each Klaviyo account has unique metric IDs. If your account doesn't have metrics with standard names, you'll need to manually configure these IDs in the code.

Typical metric types needed:
- Revenue/Placed Order metrics
- Email open metrics
- Email click metrics
- Conversion metrics

### API Version

- The dashboard uses Klaviyo API version `2025-01-15` (latest as of March 2025)
- All requests include this version in the `revision` header (lowercase, as required by Klaviyo)
- The API version can be configured via the `KLAVIYO_API_VERSION` environment variable

## Implementation Details

### API Client Structure

The API client in `klaviyoApiClient.ts` handles communication with the Klaviyo API, including:

1. Authentication using the API key
2. Rate limiting protection with exponential backoff
3. Proper error handling and fallback mechanisms
4. Comprehensive logging for debugging

### Service Implementation

Each data type has a dedicated service that handles:

1. Fetching raw data from the Klaviyo API
2. Transforming the data to the format expected by the frontend
3. Calculating derived metrics (e.g., conversion rates)
4. Providing fallback data when API calls fail

### Data Processing Flow

When the frontend requests data, the following process occurs:

1. The frontend makes a request to our backend API
2. The backend controller handles the request and calls the appropriate service
3. The service uses `klaviyoApiClient` to fetch data from Klaviyo API
4. The service transforms raw Klaviyo data into the format needed by the frontend
5. If real data is available, it's used; otherwise, synthetic data is generated
6. For metrics that aren't directly available from Klaviyo, we compute reasonable estimates
7. The transformed data is returned to the frontend for display

### Synthetic Data Generation

For metrics that aren't directly available from the Klaviyo API:

1. We use deterministic random functions based on IDs to ensure consistent values
2. Different types of flows/campaigns get different base multipliers for realistic estimates
3. Metrics are calculated using industry-standard relationships (e.g., click rates as a percentage of opens)
4. Revenue is estimated based on conversions and average order values

### Endpoint Structure

All Klaviyo API endpoints use the following structure:

```
https://a.klaviyo.com/api/{endpoint}
```

Note the `/api/` prefix which is required for all endpoints.

## Common API Issues and Solutions

### 1. "Nothing Available" in Dashboard Sections

If dashboard sections show "Nothing Available" messages:

- **Cause:** The API calls are failing or returning empty results
- **Solution:**
  1. Check API key permissions in Klaviyo
  2. Look for console errors indicating specific API issues
  3. Verify that appropriate metrics exist in the Klaviyo account
  4. Check for proper data transformation in the service files
  5. Verify that the specific entity type (campaigns, flows, etc.) exists in your Klaviyo account

### 2. Static Data in Overview Cards

If overview cards show static data while other sections show no data:

- **Cause:** The system is falling back to static mock data
- **Solution:**
  1. Check if the Klaviyo account has the specific metrics needed
  2. Verify the Shopify Placed Order Metric ID (`WRfUa5`) exists and is accessible
  3. Check backend logs for specific API errors
  4. Look at the `overviewService.ts` to verify it's properly processing the metrics

### 3. Synthetic vs. Real Metrics

If you notice that some metrics don't match your Klaviyo dashboard:

- **Cause:** We're using synthetic generation for metrics not directly available through the API
- **Solution:**
  1. Check the API logs to see what data is actually coming from Klaviyo
  2. Adjust the multipliers in the transformation functions to match your expected values
  3. If available, implement specific metric IDs for your key performance indicators

### 4. API Authentication Errors

If experiencing 401/403 errors:

- **Cause:** Invalid API key or insufficient permissions
- **Solution:**
  1. Verify the API key in the `.env` file
  2. Generate a new API key with appropriate permissions in Klaviyo
  3. Ensure the API key is not revoked or expired

### 4. Rate Limiting Errors

If experiencing 429, too many requests errors:

- **Cause:** Exceeding Klaviyo's API rate limits
- **Solution:**
  1. The system already implements exponential backoff
  2. Increase the `retryDelay` parameter in `klaviyoApiClient.ts` if necessary
  3. Reduce the frequency of API calls by increasing cache TTLs

## Debugging API Issues

### Enable Debug Logging

Set `DEBUG=true` in the `.env` file to enable comprehensive API request/response logging.

### Check Backend Logs

Start the backend in debug mode to see detailed API interactions:

```bash
cd backend
DEBUG=* npm run dev
```

### Test Specific Endpoints

Use tools like Postman or curl to test specific endpoints:

```bash
curl -H "Authorization: Bearer pk_2d109a05c4b7b9bb3b7259ba172e385f2d" \
     -H "revision: 2025-01-15" \
     -H "Accept: application/json" \
     https://a.klaviyo.com/api/metrics
```

## Performance Optimization

### Caching

- Frontend implements client-side caching with a 15-minute TTL
- Backend implements request deduplication to prevent duplicate in-flight requests
- Refetch intervals are set to 30 minutes to minimize API calls

### Data Throttling

- API requests are throttled with a minimum delay between requests
- Exponential backoff is implemented for rate-limited requests

## Next Steps for API Integration

1. Configure additional metric IDs for more accurate data
2. Implement proper correlation between related metrics (e.g., email sends vs. opens)
3. Add more sophisticated fallback mechanisms based on available metrics
4. Enhance the error reporting to provide more user-friendly messages