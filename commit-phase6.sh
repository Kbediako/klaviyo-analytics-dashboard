#!/bin/bash

# Commit Phase 6: Testing and Deployment

# Add all files
git add backend/src/services/__tests__/klaviyoApiClient.test.ts
git add backend/src/repositories/__tests__/metricRepository.test.ts
git add backend/src/tests/api.test.ts
git add Dockerfile
git add docker-compose.prod.yml
git add .github/workflows/ci.yml
git add Documentation/knowledge-transfer.md

# Commit with message
git commit -m "Phase 6: Testing and Deployment

- Added comprehensive unit tests for API client
- Implemented integration tests for database repositories
- Added E2E tests for API endpoints
- Set up Docker configuration for production deployment
- Configured CI/CD pipeline with GitHub Actions"

echo "Phase 6 changes committed successfully!"
