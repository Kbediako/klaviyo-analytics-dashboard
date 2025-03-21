#!/bin/bash
# Klaviyo Analytics Dashboard - Database Restore Script
# This script restores a PostgreSQL database from a backup

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

# Backup directory
BACKUP_DIR=${BACKUP_DIR:-/app/backups}

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to display help message
show_help() {
  echo "Klaviyo Analytics Dashboard - Database Restore Utility"
  echo "Usage: $0 [options] BACKUP_FILE"
  echo ""
  echo "Options:"
  echo "  -h, --help            Show this help message"
  echo "  -l, --list            List available backups"
  echo "  -t, --test            Test backup integrity without restoring"
  echo "  -f, --force           Force restore without confirmation"
  echo "  -v, --verbose         Enable verbose output"
  echo "  -n, --new-db NAME     Restore to a new database with specified name"
  echo ""
  echo "Example:"
  echo "  $0 --list"
  echo "  $0 /app/backups/daily/klaviyo_analytics_20250315_120000.sql.gz"
  echo "  $0 --new-db klaviyo_analytics_test /app/backups/hourly/latest.sql.gz"
  echo ""
}

# Function to list available backups
list_backups() {
  echo "Available backups:"
  echo ""
  echo "Hourly backups:"
  ls -lh "${BACKUP_DIR}/hourly"/*.sql.gz 2>/dev/null | sort -r | awk '{print "  " $6 " " $7 " " $8 " " $9 " (" $5 ")"}'
  echo ""
  echo "Daily backups:"
  ls -lh "${BACKUP_DIR}/daily"/*.sql.gz 2>/dev/null | sort -r | awk '{print "  " $6 " " $7 " " $8 " " $9 " (" $5 ")"}'
  echo ""
  echo "Weekly backups:"
  ls -lh "${BACKUP_DIR}/weekly"/*.sql.gz 2>/dev/null | sort -r | awk '{print "  " $6 " " $7 " " $8 " " $9 " (" $5 ")"}'
  echo ""
  echo "Monthly backups:"
  ls -lh "${BACKUP_DIR}/monthly"/*.sql.gz 2>/dev/null | sort -r | awk '{print "  " $6 " " $7 " " $8 " " $9 " (" $5 ")"}'
  echo ""
}

# Function to test backup integrity
test_backup() {
  local backup_file=$1
  
  if [ ! -f "${backup_file}" ]; then
    log "ERROR: Backup file not found: ${backup_file}"
    exit 1
  fi
  
  log "Testing backup integrity: ${backup_file}"
  
  # Set PostgreSQL password
  export PGPASSWORD="${DB_PASSWORD}"
  
  # Test the backup
  gunzip -c "${backup_file}" | pg_restore -l > /dev/null 2>&1
  local test_status=$?
  unset PGPASSWORD
  
  if [ $test_status -eq 0 ]; then
    log "Backup integrity check passed: ${backup_file}"
    return 0
  else
    log "ERROR: Backup integrity check failed for ${backup_file}"
    return 1
  fi
}

# Function to restore backup
restore_backup() {
  local backup_file=$1
  local target_db=$2
  local force=$3
  
  # Check if backup file exists
  if [ ! -f "${backup_file}" ]; then
    log "ERROR: Backup file not found: ${backup_file}"
    exit 1
  fi
  
  # Verify backup integrity
  test_backup "${backup_file}"
  if [ $? -ne 0 ]; then
    log "ERROR: Refusing to restore from a corrupted backup"
    exit 1
  fi
  
  # Display backup metadata if available
  if [ -f "${backup_file}.meta" ]; then
    echo ""
    echo "Backup metadata:"
    cat "${backup_file}.meta"
    echo ""
  fi
  
  # Get confirmation unless force flag is set
  if [ "${force}" != "true" ]; then
    echo ""
    echo "WARNING: This will overwrite the existing database '${target_db}' with data from backup."
    echo "All current data will be lost."
    echo ""
    read -p "Are you sure you want to proceed? [y/N] " confirm
    
    if [ "${confirm}" != "y" ] && [ "${confirm}" != "Y" ]; then
      log "Restore cancelled by user"
      exit 0
    fi
  fi
  
  # Set PostgreSQL password
  export PGPASSWORD="${DB_PASSWORD}"
  
  # Check if target database exists
  db_exists=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -lqt | cut -d \| -f 1 | grep -w "${target_db}" | wc -l)
  
  if [ "${db_exists}" -eq 1 ]; then
    # For existing DB, create a temporary database for restore
    temp_db="${target_db}_restore_temp"
    
    log "Creating temporary database: ${temp_db}"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "CREATE DATABASE ${temp_db} WITH OWNER = ${DB_USER} ENCODING = 'UTF8';"
    
    # Restore to temporary database
    log "Restoring backup to temporary database: ${temp_db}"
    gunzip -c "${backup_file}" | pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${temp_db}" --clean --no-owner --no-privileges --verbose
    
    # Terminate connections to target database
    log "Terminating connections to ${target_db}"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${target_db}' AND pid <> pg_backend_pid();"
    
    # Rename databases to swap them
    log "Swapping databases"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "ALTER DATABASE ${target_db} RENAME TO ${target_db}_old;"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "ALTER DATABASE ${temp_db} RENAME TO ${target_db};"
    
    # Drop old database
    log "Dropping old database"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "DROP DATABASE ${target_db}_old;"
  else
    # For new database, create and restore directly
    log "Creating new database: ${target_db}"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "CREATE DATABASE ${target_db} WITH OWNER = ${DB_USER} ENCODING = 'UTF8';"
    
    log "Restoring backup to database: ${target_db}"
    gunzip -c "${backup_file}" | pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${target_db}" --clean --no-owner --no-privileges --verbose
  fi
  
  # Clear PostgreSQL password
  unset PGPASSWORD
  
  log "Database restore completed successfully"
  log "Target database: ${target_db}"
  log "Source backup: ${backup_file}"
}

# Default values
BACKUP_FILE=""
FORCE_RESTORE=false
VERBOSE=false
NEW_DB=""
ACTION="restore"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -l|--list)
      ACTION="list"
      shift
      ;;
    -t|--test)
      ACTION="test"
      shift
      ;;
    -f|--force)
      FORCE_RESTORE=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -n|--new-db)
      NEW_DB="$2"
      shift 2
      ;;
    *)
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

# Enable verbose mode if requested
if [ "${VERBOSE}" = "true" ]; then
  set -x
fi

# Handle requested action
case "${ACTION}" in
  list)
    list_backups
    ;;
  test)
    if [ -z "${BACKUP_FILE}" ]; then
      log "ERROR: No backup file specified for testing"
      show_help
      exit 1
    fi
    test_backup "${BACKUP_FILE}"
    ;;
  restore)
    if [ -z "${BACKUP_FILE}" ]; then
      log "ERROR: No backup file specified for restore"
      show_help
      exit 1
    fi
    
    TARGET_DB="${NEW_DB:-${DB_NAME}}"
    restore_backup "${BACKUP_FILE}" "${TARGET_DB}" "${FORCE_RESTORE}"
    ;;
esac

exit 0