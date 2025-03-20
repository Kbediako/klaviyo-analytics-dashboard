#!/bin/bash

# Commit script for Phase 4: Analytics Engine Development

echo "Committing Phase 4: Analytics Engine Development..."

# Add all files
git add backend/src/analytics/timeSeriesAnalyzer.ts
git add backend/src/analytics/forecastService.ts
git add backend/src/controllers/analyticsController.ts
git add backend/src/routes/analyticsRoutes.ts
git add backend/src/index.ts
git add backend/src/analytics/__tests__/timeSeriesAnalyzer.test.ts
git add backend/src/analytics/__tests__/forecastService.test.ts
git add backend/src/controllers/__tests__/analyticsController.test.ts

# Commit with message
git commit -m "Phase 4: Implement Analytics Engine

- Added time series analysis with trend extraction and decomposition
- Created forecasting models with confidence intervals
- Built analytics API endpoints for time-series data and forecasts
- Implemented anomaly detection and correlation analysis
- Added comprehensive test coverage"

echo "Commit completed successfully!"
