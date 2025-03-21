#!/bin/bash

# This script commits all remaining files in the project
# Usage: ./commit-remaining-files.sh

set -e

# 1. Database-related files
echo "Committing database-related files..."
git add backend/src/database/index.ts backend/src/database/mock-db.ts backend/src/utils/db.ts
git commit -m "Add database utilities and mock database implementation"

# 2. Service-related files
echo "Committing service-related files..."
git add backend/src/services/cache-service.ts backend/src/services/dataSyncService.ts backend/src/services/dataSyncService.fix.ts backend/src/services/klaviyoApiClient.ts backend/src/services/monitoring-service.ts backend/src/services/overviewService.ts
git commit -m "Update services with improved error handling and caching"

# 3. Middleware, repositories, and routes
echo "Committing middleware, repositories, and routes..."
git add backend/src/middleware/cache-middleware.ts backend/src/repositories/campaignRepository.ts backend/src/routes/campaigns.ts
git commit -m "Update middleware, repositories, and routes for better performance"

# 4. Utility files
echo "Committing utility files..."
git add backend/src/utils/dateUtils.ts backend/src/utils/jsonApiUtils.ts backend/src/utils/jsonApiUtils.test.ts
git commit -m "Improve utility functions for date handling and JSON API formatting"

# 5. Scripts and configuration files
echo "Committing scripts and configuration files..."
git add backend/package.json backend/package-lock.json commit-fix-datasync-service.sh run-with-live-api-no-db.sh run-with-live-api-no-typecheck.sh
git commit -m "Add scripts for running with different configurations"

# 6. Ignore logs directory
echo "Creating .gitignore entry for logs directory..."
echo "backend/logs/" >> .gitignore
git add .gitignore
git commit -m "Add logs directory to .gitignore"

echo "All remaining files have been committed successfully."
