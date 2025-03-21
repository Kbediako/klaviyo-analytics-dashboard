#!/bin/bash

# Fix TypeScript errors in dataSyncService.ts
git add backend/src/services/dataSyncService.ts
git commit -m "Fix TypeScript errors in dataSyncService.ts

- Replaced dataSyncService.ts with the fixed version from dataSyncService.fix.ts
- Fixed DateRange type issues and property access errors
- Fixed missing parameters in API client calls
- Resolved implicit any type warnings"

echo "Committed dataSyncService.ts fixes"
