#!/bin/bash

# Start the database using Docker Compose
echo "Starting TimescaleDB..."
docker-compose up -d timescaledb

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Check if the database is ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker-compose exec timescaledb pg_isready -U klaviyo -d klaviyo_analytics; then
    echo "Database is ready!"
    break
  fi
  
  attempt=$((attempt + 1))
  echo "Waiting for database to be ready... (Attempt $attempt/$max_attempts)"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "Database failed to start after $max_attempts attempts"
  exit 1
fi

# Run migrations
echo "Running database migrations..."
node db/run-migrations.js

echo "Database setup complete!"
