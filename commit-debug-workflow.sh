#!/bin/bash

# Commit Debug Workflow Files
# This script commits all the files related to the debug workflow

# Add all the new files
git add .github/workflows/debug.yml
git add .github/workflows/lighthouse-config.js
git add scripts/ci-browser-tests.js
git add scripts/db-test-scripts/setup-test-db.js
git add scripts/db-test-scripts/db-schema.test.js
git add scripts/db-test-scripts/data-integrity.test.js
git add scripts/run-debug-tests.js
git add Documentation/testing/debug-workflow.md

# Commit with a descriptive message
git commit -m "Add enhanced debugging workflow with automated testing

This commit adds:
- Debug workflow GitHub Action (.github/workflows/debug.yml)
- Browser testing with screenshots (scripts/ci-browser-tests.js)
- Database validation tests (scripts/db-test-scripts/*)
- Performance testing with Lighthouse (.github/workflows/lighthouse-config.js)
- Local debug test runner (scripts/run-debug-tests.js)
- Documentation (Documentation/testing/debug-workflow.md)

The debug workflow can be triggered manually, automatically on PRs/pushes,
or on a weekly schedule. It provides enhanced test reporting, browser testing
with screenshots, database validation, and performance testing."

echo "Committed debug workflow files successfully!"
echo "To push to the remote repository, run: git push origin <branch-name>"
