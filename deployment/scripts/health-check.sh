#!/bin/bash

# =============================================================================
# UMP Production Health Check Script
# =============================================================================
# This script performs comprehensive health checks on the UMP production
# environment including services, database, Redis, file system, and external
# dependencies.
#
# Usage: ./health-check.sh [--format=json|text] [--verbose] [--timeout=seconds]
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-text}"
VERBOSE="${VERBOSE:-false}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-30}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
LOG_FILE="${LOG_FILE:-/var/log/ump/health-check.log}"

# Service endpoints
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:3000}"
ADMIN_URL="${ADMIN_URL:-http://localhost:3002}"
MOBILE_URL="${MOBILE_URL:-http://localhost:3003}"

# Database configuration
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-ump_prod}"
POSTGRES_USER="${POSTGRES_USER:-ump}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

# Redis configuration
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"

# File system paths
UPLOADS_DIR="${UPLOADS_DIR:-/var/lib/ump/uploads}"
LOGS_DIR="${LOGS_DIR:-/var/log/ump}"
TEMP_DIR="${TEMP_DIR:-/tmp/ump}"

# External services
OPENAI_API_URL="https://api.openai.com/v1/models"
STRIPE_API_URL="https://api.stripe.com/v1/account"
SENDGRID_API_URL="https://api.sendgrid.com/v3/user/profile"

# Health check results
declare -A HEALTH_RESULTS
declare -A HEALTH_DETAILS
declare -A HEALTH_METRICS

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
    
    if [ "$VERBOSE" = "true" ] || [ "$level" = "ERROR" ]; then
        case "$level" in
            "INFO")
                echo -e "${BLUE}[${timestamp}] INFO: ${message}${NC}" >&2
                ;;
            "WARN")
                echo -e "${YELLOW}[${timestamp}] WARN: ${message}${NC}" >&2
                ;;
            "ERROR")
                echo -e "${RED}[${timestamp}] ERROR: ${message}${NC}" >&2
                ;;
            "SUCCESS")
                echo -e "${GREEN}[${timestamp}] SUCCESS: ${message}${NC}" >&2
                ;;
        esac
    fi
    
    # Log to file if log directory exists
    if [ -d "$(dirname "$LOG_FILE")" ]; then
        echo "[${timestamp}] ${level}: ${message}" >> "$LOG_FILE"
    fi
}

set_result() {
    local component="$1"
    local status="$2"
    local details="$3"
    local metrics="${4:-}"
    
    HEALTH_RESULTS["$component"]="$status"
    HEALTH_DETAILS["$component"]="$details"
    if [ -n "$metrics" ]; then
        HEALTH_METRICS["$component"]="$metrics"
    fi
}

http_check() {
    local url="$1"
    local expected_status="${2:-200}"
    local timeout="${3:-$TIMEOUT}"
    
    local start_time=$(date +%s.%N)
    local response
    local status_code
    local response_time
    
    if response=$(curl -s -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null); then
        status_code="${response: -3}"
        local end_time=$(date +%s.%N)
        response_time=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "0")
        
        if [ "$status_code" = "$expected_status" ]; then
            echo "success|$response_time|$status_code"
        else
            echo "failed|$response_time|$status_code"
        fi
    else
        echo "failed|0|0"
    fi
}

port_check() {
    local host="$1"
    local port="$2"
    local timeout="${3:-5}"
    
    if timeout "$timeout" bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        echo "success"
    else
        echo "failed"
    fi
}

disk_usage() {
    local path="$1"
    
    if [ -d "$path" ]; then
        df -h "$path" | awk 'NR==2 {print $5}' | sed 's/%//'
    else
        echo "0"
    fi
}

memory_usage() {
    free | awk 'NR==2{printf "%.1f", $3*100/$2}'
}

cpu_usage() {
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//'
}

# =============================================================================
# HEALTH CHECK FUNCTIONS
# =============================================================================

check_system_resources() {
    log "INFO" "Checking system resources..."
    
    local cpu_usage=$(cpu_usage)
    local memory_usage=$(memory_usage)
    local disk_usage_root=$(disk_usage "/")
    local disk_usage_uploads=$(disk_usage "$UPLOADS_DIR")
    
    local status="healthy"
    local details="CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Disk: ${disk_usage_root}%"
    local metrics="cpu=${cpu_usage},memory=${memory_usage},disk_root=${disk_usage_root},disk_uploads=${disk_usage_uploads}"
    
    # Check thresholds
    if (( $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo 0) )); then
        status="warning"
        details="$details (High CPU usage)"
    fi
    
    if (( $(echo "$memory_usage > 85" | bc -l 2>/dev/null || echo 0) )); then
        status="critical"
        details="$details (High memory usage)"
    fi
    
    if (( $(echo "$disk_usage_root > 90" | bc -l 2>/dev/null || echo 0) )); then
        status="critical"
        details="$details (High disk usage)"
    fi
    
    set_result "system_resources" "$status" "$details" "$metrics"
    log "SUCCESS" "System resources check completed"
}

check_database() {
    log "INFO" "Checking PostgreSQL database..."
    
    local status="healthy"
    local details=""
    local metrics=""
    
    # Check port connectivity
    local port_status=$(port_check "$POSTGRES_HOST" "$POSTGRES_PORT")
    if [ "$port_status" != "success" ]; then
        set_result "database" "critical" "Cannot connect to PostgreSQL port $POSTGRES_PORT"
        return
    fi
    
    # Check database connectivity and get metrics
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    local start_time=$(date +%s.%N)
    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
           -c "SELECT 1;" &>/dev/null; then
        local end_time=$(date +%s.%N)
        local response_time=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "0")
        
        # Get database metrics
        local connections=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
                          -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ' || echo "0")
        
        local db_size=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
                       -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" 2>/dev/null | tr -d ' ' || echo "unknown")
        
        details="Connected, Response time: ${response_time}s, Connections: $connections, Size: $db_size"
        metrics="response_time=${response_time},connections=${connections}"
        
        # Check connection threshold
        if [ "$connections" -gt 80 ]; then
            status="warning"
            details="$details (High connection count)"
        fi
    else
        status="critical"
        details="Cannot connect to database"
    fi
    
    unset PGPASSWORD
    set_result "database" "$status" "$details" "$metrics"
    log "SUCCESS" "Database check completed"
}

check_redis() {
    log "INFO" "Checking Redis cache..."
    
    local status="healthy"
    local details=""
    local metrics=""
    
    # Check port connectivity
    local port_status=$(port_check "$REDIS_HOST" "$REDIS_PORT")
    if [ "$port_status" != "success" ]; then
        set_result "redis" "critical" "Cannot connect to Redis port $REDIS_PORT"
        return
    fi
    
    # Check Redis connectivity and get metrics
    local start_time=$(date +%s.%N)
    local redis_cmd="redis-cli -h $REDIS_HOST -p $REDIS_PORT"
    if [ -n "$REDIS_PASSWORD" ]; then
        redis_cmd="$redis_cmd -a $REDIS_PASSWORD"
    fi
    
    if $redis_cmd ping &>/dev/null; then
        local end_time=$(date +%s.%N)
        local response_time=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "0")
        
        # Get Redis metrics
        local memory_usage=$($redis_cmd info memory | grep "used_memory_human:" | cut -d: -f2 | tr -d '\r' || echo "unknown")
        local connected_clients=$($redis_cmd info clients | grep "connected_clients:" | cut -d: -f2 | tr -d '\r' || echo "0")
        local keyspace_hits=$($redis_cmd info stats | grep "keyspace_hits:" | cut -d: -f2 | tr -d '\r' || echo "0")
        local keyspace_misses=$($redis_cmd info stats | grep "keyspace_misses:" | cut -d: -f2 | tr -d '\r' || echo "0")
        
        details="Connected, Response time: ${response_time}s, Memory: $memory_usage, Clients: $connected_clients"
        metrics="response_time=${response_time},connected_clients=${connected_clients},keyspace_hits=${keyspace_hits},keyspace_misses=${keyspace_misses}"
        
        # Check client threshold
        if [ "$connected_clients" -gt 100 ]; then
            status="warning"
            details="$details (High client count)"
        fi
    else
        status="critical"
        details="Cannot connect to Redis"
    fi
    
    set_result "redis" "$status" "$details" "$metrics"
    log "SUCCESS" "Redis check completed"
}

check_services() {
    log "INFO" "Checking UMP services..."
    
    local services=(
        "backend:$BACKEND_URL/health"
        "gateway:$GATEWAY_URL/health"
        "admin:$ADMIN_URL/health"
        "mobile:$MOBILE_URL/health"
    )
    
    for service_info in "${services[@]}"; do
        local service_name=$(echo "$service_info" | cut -d: -f1)
        local service_url=$(echo "$service_info" | cut -d: -f2-)
        
        log "INFO" "Checking $service_name service..."
        
        local check_result=$(http_check "$service_url" "200" "$TIMEOUT")
        local status=$(echo "$check_result" | cut -d'|' -f1)
        local response_time=$(echo "$check_result" | cut -d'|' -f2)
        local status_code=$(echo "$check_result" | cut -d'|' -f3)
        
        if [ "$status" = "success" ]; then
            local details="Healthy, Response time: ${response_time}s, Status: $status_code"
            local metrics="response_time=${response_time},status_code=${status_code}"
            set_result "service_$service_name" "healthy" "$details" "$metrics"
        else
            local details="Unhealthy, Status: $status_code"
            set_result "service_$service_name" "critical" "$details"
        fi
    done
    
    log "SUCCESS" "Services check completed"
}

check_file_system() {
    log "INFO" "Checking file system..."
    
    local status="healthy"
    local details=""
    local issues=()
    
    # Check critical directories
    local dirs=("$UPLOADS_DIR" "$LOGS_DIR" "$TEMP_DIR")
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            issues+=("Missing directory: $dir")
        elif [ ! -w "$dir" ]; then
            issues+=("Not writable: $dir")
        fi
    done
    
    # Check disk space
    local uploads_usage=$(disk_usage "$UPLOADS_DIR")
    local logs_usage=$(disk_usage "$LOGS_DIR")
    
    if (( $(echo "$uploads_usage > 85" | bc -l 2>/dev/null || echo 0) )); then
        issues+=("High disk usage in uploads: ${uploads_usage}%")
    fi
    
    if (( $(echo "$logs_usage > 90" | bc -l 2>/dev/null || echo 0) )); then
        issues+=("High disk usage in logs: ${logs_usage}%")
    fi
    
    if [ ${#issues[@]} -gt 0 ]; then
        status="warning"
        details=$(IFS=', '; echo "${issues[*]}")
    else
        details="All directories accessible, Uploads: ${uploads_usage}%, Logs: ${logs_usage}%"
    fi
    
    local metrics="uploads_usage=${uploads_usage},logs_usage=${logs_usage}"
    set_result "file_system" "$status" "$details" "$metrics"
    log "SUCCESS" "File system check completed"
}

check_external_services() {
    log "INFO" "Checking external services..."
    
    local services=(
        "openai:$OPENAI_API_URL"
        "stripe:$STRIPE_API_URL"
        "sendgrid:$SENDGRID_API_URL"
    )
    
    for service_info in "${services[@]}"; do
        local service_name=$(echo "$service_info" | cut -d: -f1)
        local service_url=$(echo "$service_info" | cut -d: -f2-)
        
        log "INFO" "Checking $service_name external service..."
        
        local check_result=$(http_check "$service_url" "200" 10)
        local status=$(echo "$check_result" | cut -d'|' -f1)
        local response_time=$(echo "$check_result" | cut -d'|' -f2)
        local status_code=$(echo "$check_result" | cut -d'|' -f3)
        
        if [ "$status" = "success" ]; then
            local details="Reachable, Response time: ${response_time}s"
            local metrics="response_time=${response_time}"
            set_result "external_$service_name" "healthy" "$details" "$metrics"
        else
            local details="Unreachable or slow, Status: $status_code"
            set_result "external_$service_name" "warning" "$details"
        fi
    done
    
    log "SUCCESS" "External services check completed"
}

check_ssl_certificates() {
    log "INFO" "Checking SSL certificates..."
    
    local domains=("${SSL_DOMAINS:-localhost}")
    local overall_status="healthy"
    local cert_details=()
    
    for domain in $domains; do
        if command -v openssl &>/dev/null; then
            local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                            openssl x509 -noout -dates 2>/dev/null || echo "")
            
            if [ -n "$cert_info" ]; then
                local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
                local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [ "$days_until_expiry" -lt 7 ]; then
                    overall_status="critical"
                    cert_details+=("$domain: expires in $days_until_expiry days")
                elif [ "$days_until_expiry" -lt 30 ]; then
                    overall_status="warning"
                    cert_details+=("$domain: expires in $days_until_expiry days")
                else
                    cert_details+=("$domain: expires in $days_until_expiry days")
                fi
            else
                overall_status="warning"
                cert_details+=("$domain: certificate check failed")
            fi
        else
            cert_details+=("OpenSSL not available")
            break
        fi
    done
    
    local details=$(IFS=', '; echo "${cert_details[*]}")
    set_result "ssl_certificates" "$overall_status" "$details"
    log "SUCCESS" "SSL certificates check completed"
}

# =============================================================================
# OUTPUT FUNCTIONS
# =============================================================================

output_text() {
    echo "UMP Health Check Report"
    echo "======================="
    echo "Timestamp: $TIMESTAMP"
    echo ""
    
    local overall_status="healthy"
    
    for component in "${!HEALTH_RESULTS[@]}"; do
        local status="${HEALTH_RESULTS[$component]}"
        local details="${HEALTH_DETAILS[$component]}"
        
        # Determine overall status
        if [ "$status" = "critical" ]; then
            overall_status="critical"
        elif [ "$status" = "warning" ] && [ "$overall_status" != "critical" ]; then
            overall_status="warning"
        fi
        
        # Format status with colors
        local status_display
        case "$status" in
            "healthy")
                status_display="${GREEN}✓ HEALTHY${NC}"
                ;;
            "warning")
                status_display="${YELLOW}⚠ WARNING${NC}"
                ;;
            "critical")
                status_display="${RED}✗ CRITICAL${NC}"
                ;;
        esac
        
        printf "%-20s %s\n" "$component:" "$status_display"
        if [ "$VERBOSE" = "true" ] || [ "$status" != "healthy" ]; then
            echo "  Details: $details"
        fi
        echo ""
    done
    
    echo "Overall Status: "
    case "$overall_status" in
        "healthy")
            echo -e "${GREEN}✓ ALL SYSTEMS HEALTHY${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠ SOME ISSUES DETECTED${NC}"
            ;;
        "critical")
            echo -e "${RED}✗ CRITICAL ISSUES DETECTED${NC}"
            ;;
    esac
}

output_json() {
    local overall_status="healthy"
    
    # Determine overall status
    for component in "${!HEALTH_RESULTS[@]}"; do
        local status="${HEALTH_RESULTS[$component]}"
        if [ "$status" = "critical" ]; then
            overall_status="critical"
        elif [ "$status" = "warning" ] && [ "$overall_status" != "critical" ]; then
            overall_status="warning"
        fi
    done
    
    echo "{"
    echo "  \"timestamp\": \"$TIMESTAMP\","
    echo "  \"overall_status\": \"$overall_status\","
    echo "  \"components\": {"
    
    local first=true
    for component in "${!HEALTH_RESULTS[@]}"; do
        if [ "$first" = false ]; then
            echo ","
        fi
        first=false
        
        local status="${HEALTH_RESULTS[$component]}"
        local details="${HEALTH_DETAILS[$component]}"
        local metrics="${HEALTH_METRICS[$component]:-}"
        
        echo -n "    \"$component\": {"
        echo -n "\"status\": \"$status\", "
        echo -n "\"details\": \"$details\""
        
        if [ -n "$metrics" ]; then
            echo -n ", \"metrics\": {\"$metrics\"}"
        fi
        
        echo -n "}"
    done
    
    echo ""
    echo "  }"
    echo "}"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --format=FORMAT       Output format: text|json (default: text)"
    echo "  --verbose             Enable verbose output"
    echo "  --timeout=SECONDS     HTTP request timeout (default: 30)"
    echo "  --help                Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  OUTPUT_FORMAT         Output format (text|json)"
    echo "  VERBOSE               Enable verbose output (true|false)"
    echo "  HEALTH_CHECK_TIMEOUT  HTTP request timeout in seconds"
    echo "  LOG_FILE              Path to log file"
}

main() {
    # Parse command line arguments
    for arg in "$@"; do
        case $arg in
            --format=*)
                OUTPUT_FORMAT="${arg#*=}"
                shift
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --timeout=*)
                TIMEOUT="${arg#*=}"
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
        esac
    done
    
    # Validate output format
    if [ "$OUTPUT_FORMAT" != "text" ] && [ "$OUTPUT_FORMAT" != "json" ]; then
        echo "Error: Invalid output format. Use 'text' or 'json'" >&2
        exit 1
    fi
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    
    log "INFO" "Starting UMP health check..."
    
    # Run health checks
    check_system_resources
    check_database
    check_redis
    check_services
    check_file_system
    check_external_services
    check_ssl_certificates
    
    # Output results
    if [ "$OUTPUT_FORMAT" = "json" ]; then
        output_json
    else
        output_text
    fi
    
    # Determine exit code based on overall status
    local exit_code=0
    for component in "${!HEALTH_RESULTS[@]}"; do
        local status="${HEALTH_RESULTS[$component]}"
        if [ "$status" = "critical" ]; then
            exit_code=2
            break
        elif [ "$status" = "warning" ]; then
            exit_code=1
        fi
    done
    
    log "INFO" "Health check completed with exit code: $exit_code"
    exit $exit_code
}

# Handle script interruption
trap 'log "ERROR" "Health check interrupted"; exit 1' INT TERM

# Run main function
main "$@"