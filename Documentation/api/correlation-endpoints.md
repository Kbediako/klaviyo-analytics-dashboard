# Correlation Analysis API Endpoints

This document details the correlation analysis API endpoints.

## Base URL

All endpoints are prefixed with `/api/analytics/`.

## Available Endpoints

### Correlation Analysis

```
GET /api/analytics/correlation
```

Calculates correlation between two metrics with performance optimizations.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `metric1` | string | - | First metric ID |
| `metric2` | string | - | Second metric ID |
| `dateRange` | string | 'last-30-days' | Date range for analysis |
| `interval` | string | '1 day' | Time bucket interval |
| `alignTimestamps` | boolean | false | Whether to align timestamps before calculation |

#### Response

```json
{
  "metric1Id": "opens",
  "metric2Id": "clicks",
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "interval": "1 day",
  "alignTimestamps": true,
  "correlation": 0.78,
  "interpretation": "Strong positive correlation",
  "series1Points": 31,
  "series2Points": 28
}
```