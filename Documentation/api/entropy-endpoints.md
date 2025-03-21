# Entropy Calculation API Endpoints

This document details the entropy calculation API endpoints.

## Base URL

All endpoints are prefixed with `/api/analytics/`.

## Available Endpoints

### Entropy Calculation

```
GET /api/analytics/entropy/:metricId
```

Calculates the sample entropy (measure of complexity/randomness) of a time series.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dateRange` | string | 'last-30-days' | Date range for analysis |
| `interval` | string | '1 day' | Time bucket interval |
| `dimension` | number | 2 | Embedding dimension for sample entropy calculation |

#### Response

```json
{
  "metricId": "metric-123",
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "interval": "1 day",
  "embeddingDimension": 2,
  "entropy": 1.23,
  "interpretation": "Moderate complexity/randomness"
}
```