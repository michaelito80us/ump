#!/bin/bash

# =============================================================================
# UMP Production Deployment Script
# =============================================================================
# This script automates the deployment of the Unified Management Platform (UMP)
# to production environments including Kubernetes, Docker Compose, and cloud
# platforms.
#
# Usage: ./deploy.sh [ENVIRONMENT] [OPTIONS]
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"
K8S_DIR="$PROJECT_ROOT/infra/k8s"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="${LOG_FILE:-/var/log/ump/deploy-${TIMESTAMP}.log}"

# Default values
ENVIRONMENT="${1:-production}"
DEPLOYMENT_TYPE="${DEPLOYMENT_TYPE:-kubernetes}"
NAMESPACE="${NAMESPACE:-ump-prod}"
HELM_RELEASE="${HELM_RELEASE:-ump}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
SKIP_TESTS="${SKIP_TESTS:-false}"
SKIP_BACKUP="${SKIP_BACKUP:-false}"
SKIP_HEALTH_CHECK="${SKIP_HEALTH_CHECK:-false}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-600}"
VERBOSE="${VERBOSE:-false}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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
            echo -e "${BLUE}[${timestamp}] INFO: ${message}${NC}"
            ;;
        "WARN")
            echo -e "${YELLOW}[${timestamp}] WARN: ${message}${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] ERROR: ${message}${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[${timestamp}] SUCCESS: ${message}${NC}"
            ;;
        "DEBUG")
            if [ "$VERBOSE" = "true" ]; then
                echo -e "${PURPLE}[${timestamp}] DEBUG: ${message}${NC}"
            fi
            ;;
    esac
    
    # Log to file if log directory exists
    if [ -d "$(dirname "$LOG_FILE")" ]; then
        echo "[${timestamp}] ${level}: ${message}" >> "$LOG_FILE"
    fi
}

confirm() {
    local message="$1"
    local default="${2:-n}"
    
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would ask for confirmation: $message"
        return 0
    fi
    
    while true; do
        if [ "$default" = "y" ]; then
            read -p "$message [Y/n]: " -r response
            response=${response:-y}
        else
            read -p "$message [y/N]: " -r response
            response=${response:-n}
        fi
        
        case "$response" in
            [Yy]|[Yy][Ee][Ss])
                return 0
                ;;
            [Nn]|[Nn][Oo])
                return 1
                ;;
            *)
                echo "Please answer yes or no."
                ;;
        esac
    done
}

check_dependencies() {
    log "INFO" "Checking deployment dependencies..."
    
    local missing_deps=()
    
    # Common dependencies
    local common_deps=("git" "curl" "jq")
    
    # Deployment-specific dependencies
    case "$DEPLOYMENT_TYPE" in
        "kubernetes")
            common_deps+=("kubectl" "helm")
            ;;
        "docker")
            common_deps+=("docker" "docker-compose")
            ;;
        "aws")
            common_deps+=("aws" "kubectl" "helm")
            ;;
        "gcp")
            common_deps+=("gcloud" "kubectl" "helm")
            ;;
        "azure")
            common_deps+=("az" "kubectl" "helm")
            ;;
    esac
    
    for dep in "${common_deps[@]}"; do
        if ! command -v "$dep" &>/dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log "ERROR" "Missing dependencies: ${missing_deps[*]}"
        log "ERROR" "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log "SUCCESS" "All dependencies are available"
}

validate_environment() {
    log "INFO" "Validating deployment environment..."
    
    # Check if environment files exist
    local env_file="$DEPLOYMENT_DIR/${ENVIRONMENT}.env"
    if [ ! -f "$env_file" ]; then
        log "ERROR" "Environment file not found: $env_file"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source "$env_file"
    set +a
    
    # Validate required environment variables
    local required_vars=(
        "POSTGRES_HOST"
        "POSTGRES_DB"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "REDIS_HOST"
        "JWT_SECRET"
        "CLERK_SECRET_KEY"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log "ERROR" "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    log "SUCCESS" "Environment validation completed"
}

run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log "INFO" "Skipping tests as requested"
        return 0
    fi
    
    log "INFO" "Running pre-deployment tests..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if needed
    if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
        log "INFO" "Installing dependencies..."
        if [ "$DRY_RUN" = "true" ]; then
            log "INFO" "DRY RUN: Would run npm install"
        else
            npm install
        fi
    fi
    
    # Run tests
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would run tests"
    else
        if [ -f "package.json" ]; then
            npm run test:ci || {
                log "ERROR" "Tests failed. Deployment aborted."
                exit 1
            }
        fi
    fi
    
    log "SUCCESS" "All tests passed"
}

build_images() {
    log "INFO" "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    local services=("backend" "gateway" "admin" "mobile")
    
    for service in "${services[@]}"; do
        local image_name="$DOCKER_REGISTRY/ump/$service:$IMAGE_TAG"
        
        log "INFO" "Building $service image: $image_name"
        
        if [ "$DRY_RUN" = "true" ]; then
            log "INFO" "DRY RUN: Would build $image_name"
        else
            docker build -t "$image_name" -f "apps/$service/Dockerfile" . || {
                log "ERROR" "Failed to build $service image"
                exit 1
            }
            
            # Push image to registry
            log "INFO" "Pushing $service image to registry..."
            docker push "$image_name" || {
                log "ERROR" "Failed to push $service image"
                exit 1
            }
        fi
    done
    
    log "SUCCESS" "All images built and pushed successfully"
}

create_backup() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        log "INFO" "Skipping backup as requested"
        return 0
    fi
    
    log "INFO" "Creating pre-deployment backup..."
    
    local backup_script="$DEPLOYMENT_DIR/scripts/backup.sh"
    if [ -f "$backup_script" ]; then
        if [ "$DRY_RUN" = "true" ]; then
            log "INFO" "DRY RUN: Would create backup"
        else
            bash "$backup_script" --type=full --tag="pre-deploy-$TIMESTAMP" || {
                log "WARN" "Backup failed, but continuing with deployment"
            }
        fi
    else
        log "WARN" "Backup script not found, skipping backup"
    fi
}

# =============================================================================
# DEPLOYMENT FUNCTIONS
# =============================================================================

deploy_kubernetes() {
    log "INFO" "Deploying to Kubernetes..."
    
    # Check kubectl context
    local current_context=$(kubectl config current-context 2>/dev/null || echo "none")
    log "INFO" "Current kubectl context: $current_context"
    
    if ! confirm "Deploy to this Kubernetes context?"; then
        log "ERROR" "Deployment cancelled by user"
        exit 1
    fi
    
    # Create namespace if it doesn't exist
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would create namespace $NAMESPACE"
    else
        kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f - || true
    fi
    
    # Apply secrets
    log "INFO" "Applying secrets..."
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would apply secrets"
    else
        kubectl create secret generic ump-secrets \
            --from-env-file="$DEPLOYMENT_DIR/${ENVIRONMENT}.env" \
            --namespace="$NAMESPACE" \
            --dry-run=client -o yaml | kubectl apply -f -
    fi
    
    # Deploy with Helm
    log "INFO" "Deploying with Helm..."
    
    local helm_args=(
        "upgrade" "--install" "$HELM_RELEASE"
        "$K8S_DIR"
        "--namespace" "$NAMESPACE"
        "--values" "$K8S_DIR/values.yaml"
        "--values" "$K8S_DIR/values.${ENVIRONMENT}.yaml"
        "--set" "global.imageTag=$IMAGE_TAG"
        "--set" "global.environment=$ENVIRONMENT"
        "--timeout" "${WAIT_TIMEOUT}s"
        "--wait"
    )
    
    if [ "$DRY_RUN" = "true" ]; then
        helm_args+=("--dry-run")
    fi
    
    helm "${helm_args[@]}" || {
        log "ERROR" "Helm deployment failed"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ] && [ "$DRY_RUN" != "true" ]; then
            log "INFO" "Rolling back deployment..."
            helm rollback "$HELM_RELEASE" --namespace="$NAMESPACE"
        fi
        exit 1
    }
    
    # Wait for rollout to complete
    if [ "$DRY_RUN" != "true" ]; then
        log "INFO" "Waiting for deployment to complete..."
        
        local deployments=("backend" "gateway" "admin" "mobile")
        for deployment in "${deployments[@]}"; do
            kubectl rollout status deployment/"ump-$deployment" \
                --namespace="$NAMESPACE" \
                --timeout="${WAIT_TIMEOUT}s" || {
                log "ERROR" "Deployment $deployment failed to roll out"
                exit 1
            }
        done
    fi
    
    log "SUCCESS" "Kubernetes deployment completed successfully"
}

deploy_docker() {
    log "INFO" "Deploying with Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    # Copy environment file
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would copy environment file"
    else
        cp "$DEPLOYMENT_DIR/${ENVIRONMENT}.env" ".env"
    fi
    
    # Deploy with Docker Compose
    local compose_file="docker-compose.${ENVIRONMENT}.yml"
    if [ ! -f "$compose_file" ]; then
        compose_file="docker-compose.yml"
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would run docker-compose up"
    else
        docker-compose -f "$compose_file" up -d --build || {
            log "ERROR" "Docker Compose deployment failed"
            exit 1
        }
        
        # Wait for services to be healthy
        log "INFO" "Waiting for services to be healthy..."
        sleep 30
        
        # Check service health
        local services=("backend" "gateway" "admin" "mobile")
        for service in "${services[@]}"; do
            local container_name="ump_${service}_1"
            if ! docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
                log "ERROR" "Service $service is not running"
                exit 1
            fi
        done
    fi
    
    log "SUCCESS" "Docker Compose deployment completed successfully"
}

deploy_aws() {
    log "INFO" "Deploying to AWS EKS..."
    
    # Update kubeconfig for EKS
    local cluster_name="${EKS_CLUSTER_NAME:-ump-prod}"
    local region="${AWS_REGION:-us-west-2}"
    
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would update kubeconfig for EKS cluster $cluster_name"
    else
        aws eks update-kubeconfig --region "$region" --name "$cluster_name" || {
            log "ERROR" "Failed to update kubeconfig for EKS cluster"
            exit 1
        }
    fi
    
    # Deploy to Kubernetes
    deploy_kubernetes
}

deploy_gcp() {
    log "INFO" "Deploying to Google GKE..."
    
    # Get GKE credentials
    local cluster_name="${GKE_CLUSTER_NAME:-ump-prod}"
    local zone="${GCP_ZONE:-us-central1-a}"
    local project="${GCP_PROJECT}"
    
    if [ -z "$project" ]; then
        log "ERROR" "GCP_PROJECT environment variable is required"
        exit 1
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would get GKE credentials for cluster $cluster_name"
    else
        gcloud container clusters get-credentials "$cluster_name" \
            --zone="$zone" --project="$project" || {
            log "ERROR" "Failed to get GKE credentials"
            exit 1
        }
    fi
    
    # Deploy to Kubernetes
    deploy_kubernetes
}

deploy_azure() {
    log "INFO" "Deploying to Azure AKS..."
    
    # Get AKS credentials
    local cluster_name="${AKS_CLUSTER_NAME:-ump-prod}"
    local resource_group="${AZURE_RESOURCE_GROUP:-ump-prod-rg}"
    
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would get AKS credentials for cluster $cluster_name"
    else
        az aks get-credentials --resource-group "$resource_group" \
            --name "$cluster_name" --overwrite-existing || {
            log "ERROR" "Failed to get AKS credentials"
            exit 1
        }
    fi
    
    # Deploy to Kubernetes
    deploy_kubernetes
}

run_health_check() {
    if [ "$SKIP_HEALTH_CHECK" = "true" ]; then
        log "INFO" "Skipping health check as requested"
        return 0
    fi
    
    log "INFO" "Running post-deployment health check..."
    
    local health_script="$DEPLOYMENT_DIR/scripts/health-check.sh"
    if [ -f "$health_script" ]; then
        if [ "$DRY_RUN" = "true" ]; then
            log "INFO" "DRY RUN: Would run health check"
        else
            # Wait a bit for services to stabilize
            sleep 30
            
            bash "$health_script" --format=text || {
                log "ERROR" "Health check failed"
                if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
                    log "INFO" "Rolling back due to health check failure..."
                    case "$DEPLOYMENT_TYPE" in
                        "kubernetes"|"aws"|"gcp"|"azure")
                            helm rollback "$HELM_RELEASE" --namespace="$NAMESPACE"
                            ;;
                        "docker")
                            docker-compose down
                            ;;
                    esac
                fi
                exit 1
            }
        fi
    else
        log "WARN" "Health check script not found, skipping health check"
    fi
    
    log "SUCCESS" "Health check passed"
}

run_database_migrations() {
    log "INFO" "Running database migrations..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "DRY RUN: Would run database migrations"
        return 0
    fi
    
    case "$DEPLOYMENT_TYPE" in
        "kubernetes"|"aws"|"gcp"|"azure")
            # Run migrations as a Kubernetes job
            kubectl run ump-migrate-"$TIMESTAMP" \
                --image="$DOCKER_REGISTRY/ump/backend:$IMAGE_TAG" \
                --namespace="$NAMESPACE" \
                --restart=Never \
                --env-from=secret/ump-secrets \
                --command -- npm run migrate || {
                log "ERROR" "Database migration failed"
                exit 1
            }
            
            # Wait for migration to complete
            kubectl wait --for=condition=complete job/ump-migrate-"$TIMESTAMP" \
                --namespace="$NAMESPACE" --timeout="${WAIT_TIMEOUT}s"
            
            # Clean up migration job
            kubectl delete job ump-migrate-"$TIMESTAMP" --namespace="$NAMESPACE"
            ;;
        "docker")
            # Run migrations with Docker
            docker run --rm \
                --env-file=".env" \
                --network="ump_default" \
                "$DOCKER_REGISTRY/ump/backend:$IMAGE_TAG" \
                npm run migrate || {
                log "ERROR" "Database migration failed"
                exit 1
            }
            ;;
    esac
    
    log "SUCCESS" "Database migrations completed"
}

notify_deployment() {
    local status="$1"
    local message="$2"
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color
        case "$status" in
            "success") color="good" ;;
            "failure") color="danger" ;;
            *) color="warning" ;;
        esac
        
        local payload=$(cat <<EOF
{
    "attachments": [{
        "color": "$color",
        "title": "UMP Deployment $status",
        "text": "$message",
        "fields": [
            {"title": "Environment", "value": "$ENVIRONMENT", "short": true},
            {"title": "Version", "value": "$IMAGE_TAG", "short": true},
            {"title": "Deployment Type", "value": "$DEPLOYMENT_TYPE", "short": true},
            {"title": "Timestamp", "value": "$TIMESTAMP", "short": true}
        ]
    }]
}
EOF
        )
        
        if [ "$DRY_RUN" = "true" ]; then
            log "INFO" "DRY RUN: Would send Slack notification"
        else
            curl -X POST -H 'Content-type: application/json' \
                --data "$payload" "$SLACK_WEBHOOK_URL" &>/dev/null || true
        fi
    fi
    
    # Email notification
    if [ -n "${EMAIL_NOTIFICATION:-}" ] && command -v mail &>/dev/null; then
        if [ "$DRY_RUN" = "true" ]; then
            log "INFO" "DRY RUN: Would send email notification"
        else
            echo "$message" | mail -s "UMP Deployment $status" "$EMAIL_NOTIFICATION" || true
        fi
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

usage() {
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "Environments:"
    echo "  production    Deploy to production environment (default)"
    echo "  staging       Deploy to staging environment"
    echo "  development   Deploy to development environment"
    echo ""
    echo "Options:"
    echo "  --type=TYPE           Deployment type: kubernetes|docker|aws|gcp|azure"
    echo "  --tag=TAG             Docker image tag (default: latest)"
    echo "  --namespace=NS        Kubernetes namespace (default: ump-prod)"
    echo "  --skip-tests          Skip running tests"
    echo "  --skip-backup         Skip creating backup"
    echo "  --skip-health-check   Skip post-deployment health check"
    echo "  --no-rollback         Don't rollback on failure"
    echo "  --dry-run             Show what would be done without executing"
    echo "  --verbose             Enable verbose output"
    echo "  --help                Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DEPLOYMENT_TYPE       Deployment type"
    echo "  DOCKER_REGISTRY       Docker registry URL"
    echo "  IMAGE_TAG             Docker image tag"
    echo "  NAMESPACE             Kubernetes namespace"
    echo "  HELM_RELEASE          Helm release name"
    echo "  WAIT_TIMEOUT          Deployment timeout in seconds"
}

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type=*)
                DEPLOYMENT_TYPE="${1#*=}"
                shift
                ;;
            --tag=*)
                IMAGE_TAG="${1#*=}"
                shift
                ;;
            --namespace=*)
                NAMESPACE="${1#*=}"
                shift
                ;;
            --skip-tests)
                SKIP_TESTS="true"
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP="true"
                shift
                ;;
            --skip-health-check)
                SKIP_HEALTH_CHECK="true"
                shift
                ;;
            --no-rollback)
                ROLLBACK_ON_FAILURE="false"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            production|staging|development)
                ENVIRONMENT="$1"
                shift
                ;;
            *)
                echo "Unknown option: $1" >&2
                usage
                exit 1
                ;;
        esac
    done
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    
    log "INFO" "Starting UMP deployment..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Deployment Type: $DEPLOYMENT_TYPE"
    log "INFO" "Image Tag: $IMAGE_TAG"
    log "INFO" "Namespace: $NAMESPACE"
    
    if [ "$DRY_RUN" = "true" ]; then
        log "WARN" "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Deployment pipeline
    local start_time=$(date +%s)
    
    trap 'log "ERROR" "Deployment interrupted"; notify_deployment "failure" "Deployment was interrupted"; exit 1' INT TERM
    
    check_dependencies
    validate_environment
    run_tests
    build_images
    create_backup
    run_database_migrations
    
    # Deploy based on type
    case "$DEPLOYMENT_TYPE" in
        "kubernetes")
            deploy_kubernetes
            ;;
        "docker")
            deploy_docker
            ;;
        "aws")
            deploy_aws
            ;;
        "gcp")
            deploy_gcp
            ;;
        "azure")
            deploy_azure
            ;;
        *)
            log "ERROR" "Unknown deployment type: $DEPLOYMENT_TYPE"
            exit 1
            ;;
    esac
    
    run_health_check
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "SUCCESS" "Deployment completed successfully in ${duration}s"
    
    notify_deployment "success" "UMP deployment to $ENVIRONMENT completed successfully in ${duration}s"
}

# Run main function
main "$@"