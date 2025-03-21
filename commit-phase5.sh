#!/bin/bash

# Script to commit Phase 5: Monitoring and Diagnostics implementation

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Committing Phase 5: Monitoring and Diagnostics implementation...${NC}"

# Add files
git add \
  backend/src/services/monitoring-service.ts \
  backend/src/middleware/monitoring-middleware.ts \
  backend/src/controllers/monitoring-controller.ts \
  backend/src/routes/monitoring-routes.ts \
  backend/src/monitoring-server.js \
  Documentation/implementation/monitoring-implementation.md \
  Documentation/implementation/live-api-setup.md \
  backend/.env.example

# Commit
git commit -m "feat: implement monitoring and diagnostics system

- Add MonitoringService for tracking system metrics, API usage, and errors
- Implement monitoring middleware for request tracking
- Add error monitoring middleware for error capture
- Create RESTful monitoring endpoints for health checks and metrics
- Add simplified monitoring server for testing
- Update documentation with monitoring implementation details
- Add guide for live API testing setup"

echo -e "${GREEN}Phase 5 committed successfully!${NC}"
