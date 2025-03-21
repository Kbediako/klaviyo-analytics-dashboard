# Cache Management API Endpoints

This document details the cache management API endpoints.

## Base URL

All endpoints are prefixed with `/api/analytics/`.

## Available Endpoints

### Cache Management

```
POST /api/analytics/clear-cache
```

Clears all analytics caches.

#### Response

```json
{
  "message": "All caches cleared successfully"
}
```