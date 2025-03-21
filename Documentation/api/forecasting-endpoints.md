# Forecasting API Endpoints

This document details the forecasting API endpoints.

## Base URL

All endpoints are prefixed with `/api/analytics/`.

## Available Endpoints

### Forecasting

```
GET /api/analytics/forecast/:metricId
```

Generates forecasts for a specific metric with performance optimizations.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dateRange` | string | 'last-30-days' | Date range for historical data |
| `horizon` | number | 30 | Number of periods to forecast |
| `interval` | string | '1 day' | Time bucket interval |
| `method` | string | 'auto' | Forecasting method ('auto', 'naive', 'seasonal_naive', 'moving_average', 'linear_regression') |
| `confidenceLevel` | number | 0.95 | Confidence level for prediction intervals (0-1) |
| `validate` | boolean | false | Whether to validate forecast against historical data |

#### Response

```json
{
  "metricId": "metric-123",
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "forecastHorizon": 14,
  "interval": "1 day",
  "method": "seasonal_naive",
  "accuracy": 0.86,
  "forecast": {
    "forecast": [/* time series points */],
    "confidence": {
      "upper": [/* time series points */],
      "lower": [/* time series points */]
    },
    "accuracy": 0.86,
    "method": "seasonal_naive",
    "metadata": {
      "validationMetrics": {
        "mape": 0.14,
        "rmse": 4.23,
        "mae": 3.15,
        "r2": 0.78
      },
      "modelParams": {
        "seasonalPeriod": 7,
        "stdDev": 3.24,
        "confidenceLevel": 0.95,
        "zValue": 1.96
      }
    }
  }
}
```