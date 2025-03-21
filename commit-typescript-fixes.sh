#!/bin/bash

# Commit TypeScript error fixes

# Add all modified and untracked files
git add backend/src/index.ts
git add backend/src/services/dataSyncService.fix.ts
git add backend/src/utils/dateUtils.ts
git add backend/src/utils/jsonApiUtils.ts
git add commit-phase4.sh
git add commit-phase5.sh
git add lib/api/client.ts
git add lib/api/endpoints.ts
git add lib/api/index.ts
git add Documentation/implementation/typescript-fixes.md
git add commit-typescript-fixes.sh
git add lib/api/__tests__/
git add lib/api/typeGuards.ts

# Commit the changes
git commit -m "Fix TypeScript errors and improve type safety

- Complete the Data Sync Service implementation
- Add comprehensive type guards for API responses
- Update API client interfaces with proper TypeScript types
- Enhance DateRange interface with better type safety
- Improve JSON:API utilities with type guards
- Add test file for type guards
- Create documentation for TypeScript fixes
- Update commit scripts"

echo "TypeScript error fixes committed successfully!"
