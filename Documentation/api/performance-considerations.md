# Performance Considerations

This document details performance considerations for the analytics API.

## Downsampling

For large datasets, the API automatically downsamples data to maintain performance while preserving visual patterns. This behavior can be controlled with the `maxPoints` and `downsampleMethod` parameters.

Example of requesting downsampled data:

```
GET /api/analytics/timeseries/metric-123?dateRange=last-year&maxPoints=365&downsampleMethod=lttb
```

## Caching

The API uses smart caching to improve response times for repeated queries. Caching duration varies by endpoint:

- Time series data: 5 minutes
- Decompositions: 15 minutes
- Forecasts: 30 minutes

To force a fresh calculation, use the cache clearing endpoint.

## Parallel Processing

For computationally intensive operations, the backend uses parallel processing to distribute workload, especially when handling large datasets (millions of points). No specific parameters are needed as this happens automatically.