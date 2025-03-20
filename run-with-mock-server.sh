#!/bin/bash

# Script to run the Klaviyo Analytics Dashboard with the mock server
# This script starts both the mock server and the frontend application

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Klaviyo Analytics Dashboard with mock server...${NC}"

# Function to find an available port
find_available_port() {
  local port=$1
  while lsof -i :$port >/dev/null 2>&1; do
    port=$((port + 1))
  done
  echo $port
}

# Find available ports
MOCK_PORT=$(find_available_port 3002)
FRONTEND_PORT=$(find_available_port 3000)

# Start the mock server in the background
echo -e "${YELLOW}Starting mock server on port ${MOCK_PORT}...${NC}"
cd backend
PORT=$MOCK_PORT node build/tests/mockServer.js &
MOCK_PID=$!
cd ..

# Wait for the mock server to start
sleep 2

# Start the frontend with the mock API URL and explicitly disable MSW
echo -e "${YELLOW}Starting frontend on port ${FRONTEND_PORT} with mock API URL (MSW disabled)...${NC}"
PORT=$FRONTEND_PORT NEXT_PUBLIC_API_URL=http://localhost:${MOCK_PORT}/api NEXT_PUBLIC_API_MOCKING=disabled npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
  echo -e "${YELLOW}Shutting down servers...${NC}"
  kill $MOCK_PID
  kill $FRONTEND_PID
  exit 0
}

# Register the cleanup function for script termination
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}Both servers are running!${NC}"
echo -e "${YELLOW}Mock server:${NC} http://localhost:${MOCK_PORT}/api/health"
echo -e "${YELLOW}Frontend:${NC} http://localhost:${FRONTEND_PORT}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Keep the script running
wait
