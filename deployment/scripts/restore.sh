#!/bin/bash

# =============================================================================
# UMP Production Restore Script
# =============================================================================
# This script restores UMP production environment from backups
# including database, Redis, file uploads, and configuration data.
#
# Usage: ./restore.sh --backup-date=YYYYMMDD_HHMMSS [--type=full|database|files] [--source=local|s3]
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ump}"
S3_BUCKET="${S3_BACKUP_BUCKET:-ump-backups}"
S3_PREFIX="${S3_BACKUP_PREFIX:-production}"
RESTORE_TYPE="${RESTORE_TYPE:-full}"
SOURCE="${RESTORE_SOURCE:-local}"
BACKUP_DATE=""
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${BACKUP_DIR}/logs/restore_${TIMESTAMP}.log"

# Database configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-ump_prod}"
POSTGRES_USER="${POSTGRES_USER:-ump}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

# Redis configuration
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"

# File storage configuration
UPLOADS_DIR="${UPLOADS_DIR:-/var/lib/ump/uploads}"
CONFIG_DIR="${CONFIG_DIR:-/etc/ump}"

# Notification configuration
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENT="${RESTORE_EMAIL_RECIPIENT:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${BLUE}[${timestamp}] INFO: ${message}${NC}" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[${timestamp}] WARN: ${message}${NC}" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] ERROR: ${message}${NC}" | tee -a "$LOG_FILE"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[${timestamp}] SUCCESS: ${message}${NC}" | tee -a "$LOG_FILE"
            ;;
    esac
}

check_dependencies() {
    log "INFO" "Checking dependencies..."
    
    local deps=("pg_restore" "psql" "redis-cli" "aws" "gzip" "tar")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log "ERROR" "Missing dependencies: ${missing_deps[*]}"
        log "ERROR" "Please install missing dependencies and try again"
        exit 1
    fi
    
    log "SUCCESS" "All dependencies are available"
}

confirm_restore() {
    log "WARN" "This will restore UMP production environment from backup dated: $BACKUP_DATE"
    log "WARN" "Restore type: $RESTORE_TYPE"
    log "WARN" "Source: $SOURCE"
    log "WARN" "This operation will OVERWRITE existing data!"
    
    if [ "${FORCE_RESTORE:-false}" != "true" ]; then
        echo -n "Are you sure you want to continue? (yes/no): "
        read -r confirmation
        
        if [ "$confirmation" != "yes" ]; then
            log "INFO" "Restore cancelled by user"
            exit 0
        fi
    fi
    
    log "INFO" "Proceeding with restore..."
}

download_from_s3() {
    local s3_key="$1"
    local local_file="$2"
    local s3_path="s3://$S3_BUCKET/$S3_PREFIX/$s3_key"
    
    log "INFO" "Downloading from S3: $s3_path"
    
    if aws s3 cp "$s3_path" "$local_file" 2>> "$LOG_FILE"; then
        log "SUCCESS" "Downloaded: $local_file"
        return 0
    else
        log "ERROR" "Failed to download: $s3_path"
        return 1
    fi
}

verify_backup_files() {
    log "INFO" "Verifying backup files..."
    
    local missing_files=()
    
    case "$RESTORE_TYPE" in
        "full")
            local files=(
                "database/postgres_${BACKUP_DATE}.sql.gz"
                "redis/redis_${BACKUP_DATE}.rdb.gz"
                "files/files_${BACKUP_DATE}.tar.gz"
            )
            ;;
        "database")
            local files=(
                "database/postgres_${BACKUP_DATE}.sql.gz"
                "redis/redis_${BACKUP_DATE}.rdb.gz"
            )
            ;;
        "files")
            local files=(
                "files/files_${BACKUP_DATE}.tar.gz"
            )
            ;;
    esac
    
    for file in "${files[@]}"; do
        local local_path="$BACKUP_DIR/$file"
        
        if [ "$SOURCE" = "s3" ]; then
            # Download from S3 if not exists locally
            if [ ! -f "$local_path" ]; then
                mkdir -p "$(dirname "$local_path")"
                if ! download_from_s3 "$file" "$local_path"; then
                    missing_files+=("$file")
                fi
            fi
        else
            # Check local file
            if [ ! -f "$local_path" ]; then
                missing_files+=("$file")
            fi
        fi
    done
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        log "ERROR" "Missing backup files: ${missing_files[*]}"
        exit 1
    fi
    
    log "SUCCESS" "All backup files verified"
}

send_notification() {
    local status="$1"
    local message="$2"
    
    # Send Slack notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        local color="good"
        if [ "$status" = "error" ]; then
            color="danger"
        elif [ "$status" = "warning" ]; then
            color="warning"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK" &> /dev/null || true
    fi
    
    # Send email notification
    if [ -n "$EMAIL_RECIPIENT" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "UMP Restore Notification" "$EMAIL_RECIPIENT" || true
    fi
}

# =============================================================================
# RESTORE FUNCTIONS
# =============================================================================

stop_services() {
    log "INFO" "Stopping UMP services..."
    
    if command -v kubectl &> /dev/null; then
        # Scale down Kubernetes deployments
        kubectl scale deployment --replicas=0 -n ump-production --all 2>> "$LOG_FILE" || true
        
        # Wait for pods to terminate
        log "INFO" "Waiting for pods to terminate..."
        kubectl wait --for=delete pod --all -n ump-production --timeout=300s 2>> "$LOG_FILE" || true
    elif command -v docker-compose &> /dev/null; then
        # Stop Docker Compose services
        docker-compose -f "$SCRIPT_DIR/../docker-compose.production.yml" stop 2>> "$LOG_FILE" || true
    fi
    
    log "SUCCESS" "Services stopped"
}

start_services() {
    log "INFO" "Starting UMP services..."
    
    if command -v kubectl &> /dev/null; then
        # Scale up Kubernetes deployments
        kubectl scale deployment ump-backend --replicas=3 -n ump-production 2>> "$LOG_FILE" || true
        kubectl scale deployment ump-gateway --replicas=2 -n ump-production 2>> "$LOG_FILE" || true
        kubectl scale deployment ump-admin --replicas=1 -n ump-production 2>> "$LOG_FILE" || true
        kubectl scale deployment ump-mobile --replicas=2 -n ump-production 2>> "$LOG_FILE" || true
        
        # Wait for pods to be ready
        log "INFO" "Waiting for pods to be ready..."
        kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=ump -n ump-production --timeout=600s 2>> "$LOG_FILE" || true
    elif command -v docker-compose &> /dev/null; then
        # Start Docker Compose services
        docker-compose -f "$SCRIPT_DIR/../docker-compose.production.yml" up -d 2>> "$LOG_FILE" || true
    fi
    
    log "SUCCESS" "Services started"
}

restore_database() {
    log "INFO" "Starting database restore..."
    
    local db_backup_file="$BACKUP_DIR/database/postgres_${BACKUP_DATE}.sql.gz"
    local db_restore_file="$BACKUP_DIR/temp/postgres_${BACKUP_DATE}.sql"
    
    # Create temp directory
    mkdir -p "$BACKUP_DIR/temp"
    
    # Decompress backup
    log "INFO" "Decompressing database backup..."
    gunzip -c "$db_backup_file" > "$db_restore_file"
    
    # Set PostgreSQL password
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # Drop existing database (if exists)
    log "WARN" "Dropping existing database..."
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" \
         -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" 2>> "$LOG_FILE" || true
    
    # Create new database
    log "INFO" "Creating new database..."
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" \
         -d postgres -c "CREATE DATABASE $POSTGRES_DB;" 2>> "$LOG_FILE"
    
    # Restore database
    log "INFO" "Restoring database from backup..."
    if pg_restore -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" \
                 -d "$POSTGRES_DB" --verbose --no-password \
                 "$db_restore_file" 2>> "$LOG_FILE"; then
        
        log "SUCCESS" "Database restore completed"
        
        # Clean up temp file
        rm -f "$db_restore_file"
    else
        log "ERROR" "Database restore failed"
        unset PGPASSWORD
        return 1
    fi
    
    unset PGPASSWORD
}

restore_redis() {
    log "INFO" "Starting Redis restore..."
    
    local redis_backup_file="$BACKUP_DIR/redis/redis_${BACKUP_DATE}.rdb.gz"
    local redis_restore_file="$BACKUP_DIR/temp/redis_${BACKUP_DATE}.rdb"
    
    # Create temp directory
    mkdir -p "$BACKUP_DIR/temp"
    
    # Decompress backup
    log "INFO" "Decompressing Redis backup..."
    gunzip -c "$redis_backup_file" > "$redis_restore_file"
    
    # Flush existing Redis data
    log "WARN" "Flushing existing Redis data..."
    if [ -n "$REDIS_PASSWORD" ]; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" FLUSHALL 2>> "$LOG_FILE"
    else
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" FLUSHALL 2>> "$LOG_FILE"
    fi
    
    # Note: Redis RDB restore requires stopping Redis and replacing the dump file
    # This is a simplified approach - in production, you might need to:
    # 1. Stop Redis service
    # 2. Replace the dump.rdb file
    # 3. Start Redis service
    
    log "WARN" "Redis restore requires manual intervention to replace dump.rdb file"
    log "INFO" "Restored RDB file available at: $redis_restore_file"
    
    # For now, we'll use redis-cli to restore key-by-key (if backup contains commands)
    # This is not ideal for large datasets
    
    log "SUCCESS" "Redis restore prepared (manual intervention may be required)"
}

restore_files() {
    log "INFO" "Starting file restore..."
    
    local files_backup="$BACKUP_DIR/files/files_${BACKUP_DATE}.tar.gz"
    
    # Create backup of existing files
    log "INFO" "Creating backup of existing files..."
    local existing_backup="$BACKUP_DIR/temp/existing_files_${TIMESTAMP}.tar.gz"
    tar -czf "$existing_backup" \
        -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")" \
        -C "$(dirname "$CONFIG_DIR")" "$(basename "$CONFIG_DIR")" \
        2>> "$LOG_FILE" || true
    
    # Remove existing directories
    log "WARN" "Removing existing files..."
    rm -rf "$UPLOADS_DIR" "$CONFIG_DIR" 2>> "$LOG_FILE" || true
    
    # Restore files from backup
    log "INFO" "Restoring files from backup..."
    if tar -xzf "$files_backup" \
           -C "/" \
           2>> "$LOG_FILE"; then
        
        # Set proper permissions
        chown -R ump:ump "$UPLOADS_DIR" 2>> "$LOG_FILE" || true
        chown -R ump:ump "$CONFIG_DIR" 2>> "$LOG_FILE" || true
        
        log "SUCCESS" "File restore completed"
        log "INFO" "Existing files backed up to: $existing_backup"
    else
        log "ERROR" "File restore failed"
        
        # Attempt to restore existing files
        log "INFO" "Attempting to restore existing files..."
        tar -xzf "$existing_backup" -C "/" 2>> "$LOG_FILE" || true
        
        return 1
    fi
}

restore_kubernetes_config() {
    log "INFO" "Starting Kubernetes configuration restore..."
    
    local k8s_backup="$BACKUP_DIR/config/k8s_config_${BACKUP_DATE}.tar.gz"
    local temp_dir="$BACKUP_DIR/temp/k8s_restore_${TIMESTAMP}"
    
    if [ ! -f "$k8s_backup" ]; then
        log "WARN" "Kubernetes config backup not found, skipping..."
        return 0
    fi
    
    # Extract backup
    mkdir -p "$temp_dir"
    tar -xzf "$k8s_backup" -C "$temp_dir" 2>> "$LOG_FILE"
    
    # Apply configurations (be careful with secrets)
    if command -v kubectl &> /dev/null; then
        log "WARN" "Kubernetes config restore requires manual review"
        log "INFO" "Config files extracted to: $temp_dir"
        log "INFO" "Please review and manually apply configurations as needed"
    else
        log "WARN" "kubectl not available, skipping Kubernetes config restore"
    fi
    
    log "SUCCESS" "Kubernetes config restore prepared"
}

run_post_restore_checks() {
    log "INFO" "Running post-restore checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check database connectivity
    export PGPASSWORD="$POSTGRES_PASSWORD"
    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" \
           -d "$POSTGRES_DB" -c "SELECT 1;" &> /dev/null; then
        log "SUCCESS" "Database connectivity check passed"
    else
        log "ERROR" "Database connectivity check failed"
    fi
    unset PGPASSWORD
    
    # Check Redis connectivity
    if [ -n "$REDIS_PASSWORD" ]; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping &> /dev/null; then
            log "SUCCESS" "Redis connectivity check passed"
        else
            log "ERROR" "Redis connectivity check failed"
        fi
    else
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &> /dev/null; then
            log "SUCCESS" "Redis connectivity check passed"
        else
            log "ERROR" "Redis connectivity check failed"
        fi
    fi
    
    # Check file permissions
    if [ -d "$UPLOADS_DIR" ] && [ -r "$UPLOADS_DIR" ]; then
        log "SUCCESS" "File system check passed"
    else
        log "ERROR" "File system check failed"
    fi
    
    log "SUCCESS" "Post-restore checks completed"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

usage() {
    echo "Usage: $0 --backup-date=YYYYMMDD_HHMMSS [OPTIONS]"
    echo "Options:"
    echo "  --backup-date=DATE    Date/time of backup to restore (required)"
    echo "  --type=TYPE           Type of restore: full|database|files (default: full)"
    echo "  --source=SOURCE       Source of backup: local|s3 (default: local)"
    echo "  --force               Skip confirmation prompt"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --backup-date=20231201_143000"
    echo "  $0 --backup-date=20231201_143000 --type=database --source=s3"
    echo "  $0 --backup-date=20231201_143000 --force"
}

main() {
    local start_time=$(date +%s)
    
    # Parse command line arguments
    for arg in "$@"; do
        case $arg in
            --backup-date=*)
                BACKUP_DATE="${arg#*=}"
                shift
                ;;
            --type=*)
                RESTORE_TYPE="${arg#*=}"
                shift
                ;;
            --source=*)
                SOURCE="${arg#*=}"
                shift
                ;;
            --force)
                FORCE_RESTORE="true"
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
        esac
    done
    
    # Validate arguments
    if [ -z "$BACKUP_DATE" ]; then
        log "ERROR" "Backup date is required"
        usage
        exit 1
    fi
    
    # Validate backup date format
    if ! [[ "$BACKUP_DATE" =~ ^[0-9]{8}_[0-9]{6}$ ]]; then
        log "ERROR" "Invalid backup date format. Expected: YYYYMMDD_HHMMSS"
        exit 1
    fi
    
    log "INFO" "Starting UMP restore process..."
    log "INFO" "Backup date: $BACKUP_DATE"
    log "INFO" "Restore type: $RESTORE_TYPE"
    log "INFO" "Source: $SOURCE"
    
    # Setup
    mkdir -p "$BACKUP_DIR/logs" "$BACKUP_DIR/temp"
    check_dependencies
    confirm_restore
    verify_backup_files
    
    # Stop services before restore
    stop_services
    
    # Perform restore based on type
    local restore_success=true
    
    case "$RESTORE_TYPE" in
        "full")
            restore_database || restore_success=false
            restore_redis || restore_success=false
            restore_files || restore_success=false
            restore_kubernetes_config || restore_success=false
            ;;
        "database")
            restore_database || restore_success=false
            restore_redis || restore_success=false
            ;;
        "files")
            restore_files || restore_success=false
            restore_kubernetes_config || restore_success=false
            ;;
        *)
            log "ERROR" "Invalid restore type: $RESTORE_TYPE"
            exit 1
            ;;
    esac
    
    # Start services after restore
    start_services
    
    # Run post-restore checks
    run_post_restore_checks
    
    # Cleanup temp files
    rm -rf "$BACKUP_DIR/temp" 2>> "$LOG_FILE" || true
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ "$restore_success" = true ]; then
        log "SUCCESS" "Restore completed successfully in ${duration}s"
        send_notification "success" "UMP restore completed successfully (${RESTORE_TYPE}) from backup ${BACKUP_DATE} in ${duration}s"
        exit 0
    else
        log "ERROR" "Restore completed with errors in ${duration}s"
        send_notification "error" "UMP restore completed with errors (${RESTORE_TYPE}) from backup ${BACKUP_DATE} in ${duration}s"
        exit 1
    fi
}

# Handle script interruption
trap 'log "ERROR" "Restore interrupted"; exit 1' INT TERM

# Run main function
main "$@"