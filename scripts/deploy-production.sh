#!/bin/bash
set -e

echo "Starting deployment to production environment..."

# Configuration
PRODUCTION_APP_DIR=${PRODUCTION_APP_DIR:-"/opt/klaviyo-analytics-dashboard"}
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: $ENV_FILE file not found!${NC}"
  echo "Please create a $ENV_FILE file with the required environment variables."
  exit 1
fi

# 2. Create a timestamp for database backup
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_FILE="db_backup_production_${TIMESTAMP}.sql"

echo -e "${YELLOW}Backing up production database...${NC}"
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  echo -e "${YELLOW}Warning: Database credentials not provided. Skipping database backup.${NC}"
else
  echo "Creating database backup: $BACKUP_FILE"
  # Use PGPASSWORD to avoid password prompt
  PGPASSWORD=${DB_PASSWORD} pg_dump -h ${DB_HOST} -U ${DB_USER} ${DB_NAME} > ${BACKUP_FILE}
  
  # Copy backup to a safe location or S3
  if [ ! -z "$BACKUP_LOCATION" ]; then
    echo "Copying backup to $BACKUP_LOCATION"
    cp ${BACKUP_FILE} ${BACKUP_LOCATION}/
  fi
  
  echo "Database backup created successfully."
fi

# 3. Check for maintenance mode flag
if [ "$ENABLE_MAINTENANCE" = "true" ]; then
  echo -e "${YELLOW}Enabling maintenance mode...${NC}"
  # Create a maintenance file that nginx can check for
  touch .maintenance
fi

# 4. Run docker-compose pull to get the latest images
echo -e "${YELLOW}Pulling latest Docker images...${NC}"
docker compose -f ${DOCKER_COMPOSE_FILE} pull

# 5. Deploy the application
echo -e "${YELLOW}Deploying application...${NC}"
docker compose -f ${DOCKER_COMPOSE_FILE} up -d

# 6. Run database migrations if needed
echo -e "${YELLOW}Running database migrations...${NC}"
docker compose -f ${DOCKER_COMPOSE_FILE} exec -T app node db/run-migrations.js

# 7. Clean up old Docker images
echo -e "${YELLOW}Cleaning up old Docker images...${NC}"
docker system prune -af --volumes

# 8. Wait for application to be ready
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

# 9. Disable maintenance mode if it was enabled
if [ "$ENABLE_MAINTENANCE" = "true" ]; then
  echo -e "${YELLOW}Disabling maintenance mode...${NC}"
  rm -f .maintenance
fi

# 10. Tag release in local Git repository
RELEASE_TAG=$(date +"%Y%m%d-%H%M%S")
echo -e "${YELLOW}Tagging release: production-${RELEASE_TAG}${NC}"
git tag "production-${RELEASE_TAG}"

echo -e "${GREEN}Deployment to production completed successfully!${NC}"
exit 0