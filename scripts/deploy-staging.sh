#!/bin/bash
set -e

echo "Starting deployment to staging environment..."

# Configuration
STAGING_APP_DIR=${STAGING_APP_DIR:-"/opt/klaviyo-analytics-dashboard"}
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.staging"

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Check if .env.staging exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: $ENV_FILE file not found!${NC}"
  echo "Please create a $ENV_FILE file with the required environment variables."
  exit 1
fi

# 2. Create a timestamp for database backup
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_FILE="db_backup_staging_${TIMESTAMP}.sql"

echo -e "${YELLOW}Backing up database...${NC}"
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  echo -e "${YELLOW}Warning: Database credentials not provided. Skipping database backup.${NC}"
else
  echo "Creating database backup: $BACKUP_FILE"
  PGPASSWORD=${DB_PASSWORD} pg_dump -h ${DB_HOST} -U ${DB_USER} ${DB_NAME} > ${BACKUP_FILE}
  echo "Database backup created successfully."
fi

# 3. Run docker-compose pull to get the latest images
echo -e "${YELLOW}Pulling latest Docker images...${NC}"
docker compose -f ${DOCKER_COMPOSE_FILE} pull

# 4. Deploy the application
echo -e "${YELLOW}Deploying application...${NC}"
docker compose -f ${DOCKER_COMPOSE_FILE} up -d

# 5. Run database migrations if needed
echo -e "${YELLOW}Running database migrations...${NC}"
docker compose -f ${DOCKER_COMPOSE_FILE} exec -T app node db/run-migrations.js

# 6. Clean up old Docker images
echo -e "${YELLOW}Cleaning up old Docker images...${NC}"
docker system prune -af --volumes

# 7. Wait for application to be ready
echo -e "${YELLOW}Waiting for application to be ready...${NC}"
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
  echo "Checking application health (attempt $attempt/$max_attempts)..."
  if curl --silent --fail http://localhost:3001/api/health; then
    echo -e "${GREEN}Application is up and running!${NC}"
    break
  fi
  
  if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}Application failed to start properly. Please check the logs.${NC}"
    docker compose -f ${DOCKER_COMPOSE_FILE} logs app
    exit 1
  fi
  
  attempt=$((attempt+1))
  sleep 5
done

echo -e "${GREEN}Deployment to staging completed successfully!${NC}"
exit 0