#!/bin/bash

# This script commits browser testing documentation changes
# Usage: ./commit-browser-testing-docs.sh

set -e

# Check if there are any changes to commit
if git diff --quiet Documentation/testing/browser-action-testing.md scripts/browser-action-demo.js; then
  echo "No changes to browser testing documentation detected."
  exit 0
fi

# Add the files
git add Documentation/testing/browser-action-testing.md scripts/browser-action-demo.js

# Create the commit
git commit -m "Update browser testing documentation and demo script"

echo "Browser testing documentation changes committed successfully."
