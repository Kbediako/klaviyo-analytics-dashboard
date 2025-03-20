#!/bin/bash

# Script to commit Phase 3 changes and prepare for Phase 4

echo "Committing Phase 3: Service Layer Enhancement"

# Check if there are any uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit."
  exit 0
fi

# Add all new files
git add .

# Commit with a descriptive message
git commit -m "Phase 3: Service Layer Enhancement

- Implemented DataSyncService for Klaviyo API to database synchronization
- Created scheduler for regular data sync jobs
- Added ProfileRepository and CampaignRepository
- Updated controllers to use database-first approach
- Added database schema for campaigns
- Added sync endpoints for manual data synchronization
- Updated documentation for service layer implementation
- Added migration scripts for database schema updates

This completes Phase 3 of the Klaviyo Analytics Dashboard enhancement project."

# Create a tag for this phase
git tag -a "phase-3-complete" -m "Phase 3: Service Layer Enhancement completed"

echo "Changes committed successfully."
echo "Created tag: phase-3-complete"

# Clean up any temporary files
echo "Cleaning up temporary files..."
find . -name "*.tmp" -type f -delete
find . -name "*.log" -type f -delete
find . -name "*.bak" -type f -delete

echo "Preparing for Phase 4: Analytics Engine Development..."

# Create a new branch for Phase 4
git checkout -b feature/analytics-engine

echo "Ready to begin Phase 4 implementation."
echo "New branch created: feature/analytics-engine"
