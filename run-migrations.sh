#!/bin/bash

# Run database migrations script
echo "Running database migrations..."

# Check if database is running
if ! docker ps | grep -q timescaledb; then
  echo "TimescaleDB container is not running. Starting database..."
  docker-compose up -d timescaledb
  
  # Wait for database to be ready
  echo "Waiting for database to be ready..."
  sleep 5
fi

# Run initial schema migration
echo "Running initial schema migration..."
docker-compose exec -T timescaledb psql -U klaviyo -d klaviyo_analytics -f /migrations/001_initial_schema.sql

# Run campaigns schema migration
echo "Running campaigns schema migration..."
docker-compose exec -T timescaledb psql -U klaviyo -d klaviyo_analytics -f /migrations/002_campaigns_schema.sql

echo "Database migrations completed successfully."
