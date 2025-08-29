#!/bin/bash

# =============================================================================
# UMP Production Backup Script
# =============================================================================
# This script performs comprehensive backups of the UMP production environment
# including database, Redis, file uploads, and configuration data.
#
# Usage: ./backup.sh [--type=full|database|files] [--retention=days]
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ump}"
S3_BUCKET="${S3_BACKUP_BUCKET:-ump-backups}"
S3_PREFIX="${S3_BACKUP_PREFIX:-production}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_TYPE="${BACKUP_TYPE:-full}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ump_backup_${TIMESTAMP}"
LOG_FILE="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"

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
EMAIL_RECIPIENT="${BACKUP_EMAIL_RECIPIENT:-}"

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
    
    local deps=("pg_dump" "redis-cli" "aws" "gzip" "tar")
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

setup_directories() {
    log "INFO" "Setting up backup directories..."
    
    local dirs=(
        "$BACKUP_DIR"
        "$BACKUP_DIR/database"
        "$BACKUP_DIR/redis"
        "$BACKUP_DIR/files"
        "$BACKUP_DIR/config"
        "$BACKUP_DIR/logs"
        "$BACKUP_DIR/temp"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    log "SUCCESS" "Backup directories created"
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
        echo "$message" | mail -s "UMP Backup Notification" "$EMAIL_RECIPIENT" || true
    fi
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================

backup_database() {
    log "INFO" "Starting database backup..."
    
    local db_backup_file="$BACKUP_DIR/database/postgres_${TIMESTAMP}.sql"
    local db_backup_compressed="${db_backup_file}.gz"
    
    # Set PostgreSQL password
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # Create database dump
    if pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" \
               -d "$POSTGRES_DB" --verbose --no-password \
               --format=custom --compress=9 \
               --file="$db_backup_file" 2>> "$LOG_FILE"; then
        
        # Compress the backup
        gzip "$db_backup_file"
        
        local backup_size=$(du -h "$db_backup_compressed" | cut -f1)
        log "SUCCESS" "Database backup completed: $db_backup_compressed ($backup_size)"
        
        # Upload to S3
        if upload_to_s3 "$db_backup_compressed" "database/postgres_${TIMESTAMP}.sql.gz"; then
            log "SUCCESS" "Database backup uploaded to S3"
        else
            log "WARN" "Failed to upload database backup to S3"
        fi
    else
        log "ERROR" "Database backup failed"
        return 1
    fi
    
    unset PGPASSWORD
}

backup_redis() {
    log "INFO" "Starting Redis backup..."
    
    local redis_backup_file="$BACKUP_DIR/redis/redis_${TIMESTAMP}.rdb"
    local redis_backup_compressed="${redis_backup_file}.gz"
    
    # Create Redis dump
    if [ -n "$REDIS_PASSWORD" ]; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" \
                  --rdb "$redis_backup_file" 2>> "$LOG_FILE"
    else
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" \
                  --rdb "$redis_backup_file" 2>> "$LOG_FILE"
    fi
    
    if [ -f "$redis_backup_file" ]; then
        # Compress the backup
        gzip "$redis_backup_file"
        
        local backup_size=$(du -h "$redis_backup_compressed" | cut -f1)
        log "SUCCESS" "Redis backup completed: $redis_backup_compressed ($backup_size)"
        
        # Upload to S3
        if upload_to_s3 "$redis_backup_compressed" "redis/redis_${TIMESTAMP}.rdb.gz"; then
            log "SUCCESS" "Redis backup uploaded to S3"
        else
            log "WARN" "Failed to upload Redis backup to S3"
        fi
    else
        log "ERROR" "Redis backup failed"
        return 1
    fi
}

backup_files() {
    log "INFO" "Starting file backup..."
    
    local files_backup="$BACKUP_DIR/files/files_${TIMESTAMP}.tar.gz"
    
    # Create tar archive of uploads and config
    if tar -czf "$files_backup" \
           -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")" \
           -C "$(dirname "$CONFIG_DIR")" "$(basename "$CONFIG_DIR")" \
           2>> "$LOG_FILE"; then
        
        local backup_size=$(du -h "$files_backup" | cut -f1)
        log "SUCCESS" "File backup completed: $files_backup ($backup_size)"
        
        # Upload to S3
        if upload_to_s3 "$files_backup" "files/files_${TIMESTAMP}.tar.gz"; then
            log "SUCCESS" "File backup uploaded to S3"
        else
            log "WARN" "Failed to upload file backup to S3"
        fi
    else
        log "ERROR" "File backup failed"
        return 1
    fi
}

backup_kubernetes_config() {
    log "INFO" "Starting Kubernetes configuration backup..."
    
    local k8s_backup="$BACKUP_DIR/config/k8s_config_${TIMESTAMP}.tar.gz"
    local temp_dir="$BACKUP_DIR/temp/k8s_${TIMESTAMP}"
    
    mkdir -p "$temp_dir"
    
    # Export Kubernetes resources
    if command -v kubectl &> /dev/null; then
        # Export secrets (excluding sensitive data)
        kubectl get secrets -n ump-production -o yaml > "$temp_dir/secrets.yaml" 2>> "$LOG_FILE" || true
        
        # Export configmaps
        kubectl get configmaps -n ump-production -o yaml > "$temp_dir/configmaps.yaml" 2>> "$LOG_FILE" || true
        
        # Export deployments
        kubectl get deployments -n ump-production -o yaml > "$temp_dir/deployments.yaml" 2>> "$LOG_FILE" || true
        
        # Export services
        kubectl get services -n ump-production -o yaml > "$temp_dir/services.yaml" 2>> "$LOG_FILE" || true
        
        # Export ingress
        kubectl get ingress -n ump-production -o yaml > "$temp_dir/ingress.yaml" 2>> "$LOG_FILE" || true
        
        # Create archive
        tar -czf "$k8s_backup" -C "$BACKUP_DIR/temp" "k8s_${TIMESTAMP}" 2>> "$LOG_FILE"
        
        # Clean up temp directory
        rm -rf "$temp_dir"
        
        local backup_size=$(du -h "$k8s_backup" | cut -f1)
        log "SUCCESS" "Kubernetes config backup completed: $k8s_backup ($backup_size)"
        
        # Upload to S3
        if upload_to_s3 "$k8s_backup" "config/k8s_config_${TIMESTAMP}.tar.gz"; then
            log "SUCCESS" "Kubernetes config backup uploaded to S3"
        else
            log "WARN" "Failed to upload Kubernetes config backup to S3"
        fi
    else
        log "WARN" "kubectl not available, skipping Kubernetes config backup"
    fi
}

upload_to_s3() {
    local local_file="$1"
    local s3_key="$2"
    local s3_path="s3://$S3_BUCKET/$S3_PREFIX/$s3_key"
    
    if aws s3 cp "$local_file" "$s3_path" --storage-class STANDARD_IA 2>> "$LOG_FILE"; then
        return 0
    else
        return 1
    fi
}

cleanup_old_backups() {
    log "INFO" "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    # Clean up local backups
    find "$BACKUP_DIR" -name "*.gz" -type f -mtime +"$RETENTION_DAYS" -delete 2>> "$LOG_FILE" || true
    find "$BACKUP_DIR" -name "*.sql" -type f -mtime +"$RETENTION_DAYS" -delete 2>> "$LOG_FILE" || true
    find "$BACKUP_DIR" -name "*.rdb" -type f -mtime +"$RETENTION_DAYS" -delete 2>> "$LOG_FILE" || true
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +"$RETENTION_DAYS" -delete 2>> "$LOG_FILE" || true
    
    # Clean up S3 backups
    local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
    
    aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" --recursive | \
    while read -r line; do
        local file_date=$(echo "$line" | awk '{print $1}' | tr -d '-')
        local file_path=$(echo "$line" | awk '{print $4}')
        
        if [ "$file_date" -lt "$cutoff_date" ]; then
            aws s3 rm "s3://$S3_BUCKET/$file_path" 2>> "$LOG_FILE" || true
            log "INFO" "Deleted old S3 backup: $file_path"
        fi
    done
    
    log "SUCCESS" "Old backup cleanup completed"
}

generate_backup_report() {
    log "INFO" "Generating backup report..."
    
    local report_file="$BACKUP_DIR/logs/backup_report_${TIMESTAMP}.txt"
    
    cat > "$report_file" << EOF
UMP Backup Report
=================
Date: $(date)
Backup Type: $BACKUP_TYPE
Backup Name: $BACKUP_NAME
Retention: $RETENTION_DAYS days

Backup Locations:
- Local: $BACKUP_DIR
- S3: s3://$S3_BUCKET/$S3_PREFIX

Backup Sizes:
EOF
    
    # Add file sizes to report
    find "$BACKUP_DIR" -name "*${TIMESTAMP}*" -type f -exec ls -lh {} \; | \
    awk '{print $9 ": " $5}' >> "$report_file"
    
    echo "" >> "$report_file"
    echo "Log File: $LOG_FILE" >> "$report_file"
    
    log "SUCCESS" "Backup report generated: $report_file"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    local start_time=$(date +%s)
    
    # Parse command line arguments
    for arg in "$@"; do
        case $arg in
            --type=*)
                BACKUP_TYPE="${arg#*=}"
                shift
                ;;
            --retention=*)
                RETENTION_DAYS="${arg#*=}"
                shift
                ;;
            --help)
                echo "Usage: $0 [--type=full|database|files] [--retention=days]"
                echo "  --type: Type of backup to perform (default: full)"
                echo "  --retention: Number of days to retain backups (default: 30)"
                exit 0
                ;;
        esac
    done
    
    log "INFO" "Starting UMP backup process..."
    log "INFO" "Backup type: $BACKUP_TYPE"
    log "INFO" "Retention: $RETENTION_DAYS days"
    
    # Setup
    check_dependencies
    setup_directories
    
    # Perform backups based on type
    local backup_success=true
    
    case "$BACKUP_TYPE" in
        "full")
            backup_database || backup_success=false
            backup_redis || backup_success=false
            backup_files || backup_success=false
            backup_kubernetes_config || backup_success=false
            ;;
        "database")
            backup_database || backup_success=false
            backup_redis || backup_success=false
            ;;
        "files")
            backup_files || backup_success=false
            backup_kubernetes_config || backup_success=false
            ;;
        *)
            log "ERROR" "Invalid backup type: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    # Cleanup and reporting
    cleanup_old_backups
    generate_backup_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ "$backup_success" = true ]; then
        log "SUCCESS" "Backup completed successfully in ${duration}s"
        send_notification "success" "UMP backup completed successfully (${BACKUP_TYPE}) in ${duration}s"
        exit 0
    else
        log "ERROR" "Backup completed with errors in ${duration}s"
        send_notification "error" "UMP backup completed with errors (${BACKUP_TYPE}) in ${duration}s"
        exit 1
    fi
}

# Handle script interruption
trap 'log "ERROR" "Backup interrupted"; exit 1' INT TERM

# Run main function
main "$@"