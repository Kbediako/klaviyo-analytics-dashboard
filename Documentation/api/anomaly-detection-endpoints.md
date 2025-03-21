# Anomaly Detection API Endpoints

This document details the anomaly detection API endpoints.

## Base URL

All endpoints are prefixed with `/api/analytics/`.

## Available Endpoints

### Anomaly Detection

```
GET /api/analytics/anomalies/:metricId
```

Detects anomalies in time series data with performance optimizations.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dateRange` | string | 'last-30-days' | Date range (e.g., 'last-30-days' or '2025-01-01,2025-01-31') |
| `interval` | string | '1 day' | Time bucket interval ('1 hour', '1 day', '1 week', '1 month') |
| `threshold` | number | 3.0 | Z-score threshold for anomaly detection |
| `lookbackWindow` | number | - | Window size for local anomaly detection (omit for global detection) |

#### Response

```json
{
  "metricId": "metric-123",
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "interval": "1 day",
  "threshold": 3.0,
  "lookbackWindow": "global",
  "anomalies": [
    { "timestamp": "2025-01-15T00:00:00Z", "value": 250.3 },
    { "timestamp": "2025-01-28T00:00:00Z", "value": 42.1 }
  ],
  "totalPoints": 31,
  "anomalyCount": 2,
  "anomalyPercentage": "6.45%"
}
```