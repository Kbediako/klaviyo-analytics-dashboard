#!/bin/bash
# Klaviyo Analytics Dashboard - Database Backup Script
# This script performs automated backups of the PostgreSQL database
# and manages backup rotation

# Exit on error
set -e

# Load environment variables
if [ -f "../.env" ]; then
  source "../.env"
fi

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-klaviyo}
DB_PASSWORD=${DB_PASSWORD:-klaviyo_pass}
DB_NAME=${DB_NAME:-klaviyo_analytics}

# Backup settings
BACKUP_DIR=${BACKUP_DIR:-/app/backups}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
MAX_HOURLY_BACKUPS=${MAX_HOURLY_BACKUPS:-24}
MAX_DAILY_BACKUPS=${MAX_DAILY_BACKUPS:-7}
MAX_WEEKLY_BACKUPS=${MAX_WEEKLY_BACKUPS:-4}
MAX_MONTHLY_BACKUPS=${MAX_MONTHLY_BACKUPS:-12}

# Create backup directories if they don't exist
mkdir -p "${BACKUP_DIR}/hourly"
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"
mkdir -p "${BACKUP_DIR}/monthly"

# Set current date variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CURRENT_DAY=$(date +"%d")
CURRENT_WEEKDAY=$(date +"%u") # 1-7, Monday is 1
CURRENT_MONTH=$(date +"%m")
CURRENT_HOUR=$(date +"%H")

# Set backup filenames
BACKUP_FILENAME="${DB_NAME}_${TIMESTAMP}.sql.gz"
HOURLY_BACKUP="${BACKUP_DIR}/hourly/${DB_NAME}_hourly_${TIMESTAMP}.sql.gz"
DAILY_BACKUP="${BACKUP_DIR}/daily/${DB_NAME}_daily_${TIMESTAMP}.sql.gz"
WEEKLY_BACKUP="${BACKUP_DIR}/weekly/${DB_NAME}_weekly_${TIMESTAMP}.sql.gz"
MONTHLY_BACKUP="${BACKUP_DIR}/monthly/${DB_NAME}_monthly_${TIMESTAMP}.sql.gz"

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Perform database backup
perform_backup() {
  local backup_file=$1
  log "Starting backup to ${backup_file}"
  
  # Use PGPASSWORD to avoid password prompt
  export PGPASSWORD="${DB_PASSWORD}"
  
  # Perform the backup with compression
  pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}" \
    --format=custom --blobs --verbose --compress=9 | gzip > "${backup_file}"
  
  local backup_status=$?
  unset PGPASSWORD
  
  if [ $backup_status -eq 0 ]; then
    log "Backup completed successfully: ${backup_file}"
    # Add metadata file with details about the backup
    echo "Backup created: $(date)" > "${backup_file}.meta"
    echo "Database: ${DB_NAME}" >> "${backup_file}.meta"
    echo "Size: $(du -h ${backup_file} | cut -f1)" >> "${backup_file}.meta"
    echo "Host: ${DB_HOST}" >> "${backup_file}.meta"
    return 0
  else
    log "Backup failed with status $backup_status"
    return 1
  fi
}

# Test the backup with pg_restore
test_backup() {
  local backup_file=$1
  log "Testing backup integrity: ${backup_file}"
  
  export PGPASSWORD="${DB_PASSWORD}"
  
  # Test the backup without actually restoring
  pg_restore -l "${backup_file}" > /dev/null 2>&1
  local test_status=$?
  unset PGPASSWORD
  
  if [ $test_status -eq 0 ]; then
    log "Backup integrity verified: ${backup_file}"
    return 0
  else
    log "Backup integrity check failed for ${backup_file}"
    return 1
  fi
}

# Rotate backups to keep only the specified number
rotate_backups() {
  local backup_dir=$1
  local max_backups=$2
  
  log "Rotating backups in ${backup_dir}, keeping ${max_backups} most recent"
  
  # Count the number of backups
  local backup_count=$(ls -1 "${backup_dir}"/*.sql.gz 2>/dev/null | wc -l)
  
  if [ "$backup_count" -gt "$max_backups" ]; then
    # Get list of backups sorted by creation time (oldest first)
    local backups_to_remove=$((backup_count - max_backups))
    log "Removing ${backups_to_remove} old backups"
    
    ls -1t "${backup_dir}"/*.sql.gz | tail -n "${backups_to_remove}" | while read backup; do
      log "Removing old backup: ${backup}"
      rm -f "${backup}" "${backup}.meta"
    done
  else
    log "No backup rotation needed (${backup_count}/${max_backups})"
  fi
}

# Main backup process
log "Starting database backup process for ${DB_NAME}"

# Always create an hourly backup
perform_backup "${HOURLY_BACKUP}"
if [ $? -ne 0 ]; then
  log "ERROR: Hourly backup failed"
  exit 1
fi

# Check for backup integrity
test_backup "${HOURLY_BACKUP}"
if [ $? -ne 0 ]; then
  log "ERROR: Backup integrity check failed"
  exit 1
fi

# Create daily backup at midnight
if [ "${CURRENT_HOUR}" = "00" ]; then
  log "Creating daily backup"
  cp "${HOURLY_BACKUP}" "${DAILY_BACKUP}"
  cp "${HOURLY_BACKUP}.meta" "${DAILY_BACKUP}.meta"
  echo "Type: Daily" >> "${DAILY_BACKUP}.meta"
fi

# Create weekly backup on Sunday
if [ "${CURRENT_WEEKDAY}" = "7" ] && [ "${CURRENT_HOUR}" = "00" ]; then
  log "Creating weekly backup"
  cp "${HOURLY_BACKUP}" "${WEEKLY_BACKUP}"
  cp "${HOURLY_BACKUP}.meta" "${WEEKLY_BACKUP}.meta"
  echo "Type: Weekly" >> "${WEEKLY_BACKUP}.meta"
fi

# Create monthly backup on the 1st of each month
if [ "${CURRENT_DAY}" = "01" ] && [ "${CURRENT_HOUR}" = "00" ]; then
  log "Creating monthly backup"
  cp "${HOURLY_BACKUP}" "${MONTHLY_BACKUP}"
  cp "${HOURLY_BACKUP}.meta" "${MONTHLY_BACKUP}.meta"
  echo "Type: Monthly" >> "${MONTHLY_BACKUP}.meta"
fi

# Rotate backups
rotate_backups "${BACKUP_DIR}/hourly" "${MAX_HOURLY_BACKUPS}"
rotate_backups "${BACKUP_DIR}/daily" "${MAX_DAILY_BACKUPS}"
rotate_backups "${BACKUP_DIR}/weekly" "${MAX_WEEKLY_BACKUPS}"
rotate_backups "${BACKUP_DIR}/monthly" "${MAX_MONTHLY_BACKUPS}"

# Cleanup old backups beyond retention period
log "Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days"
find "${BACKUP_DIR}" -type f -name "*.sql.gz*" -mtime +${BACKUP_RETENTION_DAYS} -exec rm -f {} \;

log "Database backup process completed successfully"
exit 0