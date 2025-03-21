#!/bin/bash

# Script to run the Klaviyo Analytics Dashboard with the live API but without Redis and database connections
# This script starts both the backend server and the frontend application

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Klaviyo Analytics Dashboard with live API (no Redis/DB)...${NC}"

# Check if .env file exists in backend directory
if [ ! -f backend/.env ]; then
  echo -e "${RED}Error: backend/.env file not found!${NC}"
  echo -e "${YELLOW}Please create a .env file in the backend directory with your Klaviyo API key.${NC}"
  echo -e "Example:"
  echo -e "KLAVIYO_API_KEY=your_api_key_here"
  echo -e "PORT=3001"
  exit 1
fi

# Create a temporary .env file with Redis and DB disabled
cp backend/.env backend/.env.backup
echo "# Disabling Redis and DB connections" >> backend/.env
echo "DISABLE_REDIS=true" >> backend/.env
echo "DISABLE_DB=true" >> backend/.env

# Start the backend server in the background
echo -e "${YELLOW}Starting backend server (with Redis and DB disabled)...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for the backend server to start
sleep 3

# Start the frontend
echo -e "${YELLOW}Starting frontend...${NC}"
NEXT_PUBLIC_API_URL=http://localhost:3001/api npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
  echo -e "${YELLOW}Shutting down servers...${NC}"
  kill $BACKEND_PID
  kill $FRONTEND_PID
  
  # Restore original .env file
  mv backend/.env.backup backend/.env
  
  exit 0
}

# Register the cleanup function for script termination
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}Both servers are running!${NC}"
echo -e "${YELLOW}Backend:${NC} http://localhost:3001/api/health"
echo -e "${YELLOW}Frontend:${NC} http://localhost:3000"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Keep the script running
wait
