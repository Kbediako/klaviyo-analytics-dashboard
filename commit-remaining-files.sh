#!/bin/bash

# Commit remaining files

# Add modified files
git add .github/workflows/ci.yml
git add backend/package-lock.json
git add backend/package.json
git add backend/src/repositories/__tests__/metricRepository.test.ts
git add backend/src/services/__tests__/klaviyoApiClient.test.ts

# Add untracked files
git add Dockerfile
git add backend/src/tests/api.test.ts
git add commit-phase4.sh
git add commit-phase5.sh
git add commit-phase6.sh
git add docker-compose.prod.yml

# Commit with message
git commit -m "Add remaining implementation files

- Added Docker configuration for production deployment
- Added CI/CD pipeline configuration
- Added E2E tests for API endpoints
- Added comprehensive unit tests for API client and repositories
- Added commit scripts for implementation phases"

echo "Remaining files committed successfully!"
