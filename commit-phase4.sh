#!/bin/bash

# Script to commit Phase 4: Data Freshness Indicators implementation

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Adding Phase 4: Data Freshness Indicators implementation...${NC}"

# Add the modified documentation file
git add Documentation/implementation/live-data-implementation.md

# Add the new component
git add components/data-freshness-indicator.tsx

# Add modified components
git add components/dashboard.tsx
git add components/overview-section.tsx
git add lib/api/client.ts

# Commit with descriptive message
git commit -m "feat: implement data freshness indicators

- Add DataFreshnessIndicator component
- Add timestamp tracking to API client
- Integrate indicators into dashboard sections
- Implement stale data warnings
- Add loading states for data fetching
- Update documentation"

echo -e "${GREEN}Phase 4 implementation committed successfully!${NC}"
