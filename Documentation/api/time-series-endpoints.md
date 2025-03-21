# Time Series API Endpoints

This document details the time series analysis API endpoints.

## Base URL

All endpoints are prefixed with `/api/analytics/`.

## Available Endpoints

### Time Series Data

```
GET /api/analytics/timeseries/:metricId
```

Retrieves time series data for a specific metric with performance optimizations.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dateRange` | string | 'last-30-days' | Date range (e.g., 'last-30-days' or '2025-01-01,2025-01-31') |
| `interval` | string | '1 day' | Time bucket interval ('1 hour', '1 day', '1 week', '1 month') |
| `maxPoints` | number | 1000 | Maximum number of data points to return |
| `downsampleMethod` | string | 'lttb' | Downsampling method ('lttb', 'min-max', 'average', 'first-last-significant') |

#### Response

```json
{
  "metricId": "metric-123",
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "interval": "1 day",
  "points": [
    { "timestamp": "2025-01-01T00:00:00Z", "value": 125.7 },
    { "timestamp": "2025-01-02T00:00:00Z", "value": 132.5 },
    // ...more points
  ],
  "totalPoints": 31,
  "downsampledPoints": 31,
  "wasDownsampled": false
}
```

### Time Series Decomposition

```
GET /api/analytics/decomposition/:metricId
```

Decomposes a time series into trend, seasonal, and residual components with performance optimizations.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dateRange` | string | 'last-30-days' | Date range (e.g., 'last-30-days' or '2025-01-01,2025-01-31') |
| `interval` | string | '1 day' | Time bucket interval ('1 hour', '1 day', '1 week', '1 month') |
| `windowSize` | number | 7 | Window size for trend extraction |
| `maxPoints` | number | 500 | Maximum number of data points to return |
| `downsampleMethod` | string | 'lttb' | Downsampling method ('lttb', 'min-max', 'average', 'first-last-significant') |

#### Response

```json
{
  "metricId": "metric-123",
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "interval": "1 day",
  "windowSize": 7,
  "decomposition": {
    "original": [/* time series points */],
    "trend": [/* time series points */],
    "seasonal": [/* time series points */],
    "residual": [/* time series points */]
  },
  "totalPoints": 31,
  "downsampledPoints": 31,
  "wasDownsampled": false
}
```