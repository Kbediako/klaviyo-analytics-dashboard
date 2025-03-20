#!/bin/bash

# Commit Phase 5: Frontend Integration

echo "Committing Phase 5: Frontend Integration..."

# Stage and commit the time series hook
git add hooks/use-time-series.ts
git commit -m "Phase 5: Add time series hook for analytics data"

# Stage and commit the forecast hook
git add hooks/use-forecast.ts
git commit -m "Phase 5: Add forecast hook for predictive analytics"

# Stage and commit the enhanced revenue chart component
git add components/enhanced-revenue-chart.tsx
git commit -m "Phase 5: Add enhanced revenue chart with forecast visualization"

# Stage and commit the test file
git add components/__tests__/enhanced-revenue-chart.test.tsx
git commit -m "Phase 5: Add tests for enhanced revenue chart component"

# Stage and commit the updated documentation
git add Documentation/knowledge-transfer.md
git commit -m "Phase 5: Update documentation with new hooks and components"

echo "Phase 5 implementation committed successfully!"
