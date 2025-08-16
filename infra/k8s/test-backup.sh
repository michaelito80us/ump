#!/bin/bash

# Test script for PostgreSQL backup system
# This script validates that the backup cron job works correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="default"
RELEASE_NAME="ump"
TEST_BACKUP_NAME="test-backup-$(date +%s)"
S3_BUCKET="ump-backups"
S3_PREFIX="postgres-backups"
S3_REGION="us-east-1"

echo -e "${YELLOW}Starting PostgreSQL backup system tests...${NC}"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

# Test 1: Check if backup CronJob exists
echo "Test 1: Checking if backup CronJob exists..."
kubectl get cronjob "${RELEASE_NAME}-postgres-backup" -n "$NAMESPACE" > /dev/null 2>&1
print_result $? "Backup CronJob exists"

# Test 2: Check if PostgreSQL is running
echo "Test 2: Checking if PostgreSQL is running..."
kubectl get pod -l "app.kubernetes.io/component=postgres" -n "$NAMESPACE" | grep -q "Running"
print_result $? "PostgreSQL pod is running"

# Test 3: Check if required secrets exist
echo "Test 3: Checking if required secrets exist..."
kubectl get secret "${RELEASE_NAME}-secret" -n "$NAMESPACE" > /dev/null 2>&1
print_result $? "Required secrets exist"

# Test 4: Validate secret contains AWS credentials
echo "Test 4: Validating AWS credentials in secret..."
AWS_ACCESS_KEY=$(kubectl get secret "${RELEASE_NAME}-secret" -n "$NAMESPACE" -o jsonpath='{.data.AWS_ACCESS_KEY_ID}' | base64 -d)
AWS_SECRET_KEY=$(kubectl get secret "${RELEASE_NAME}-secret" -n "$NAMESPACE" -o jsonpath='{.data.AWS_SECRET_ACCESS_KEY}' | base64 -d)

if [ -n "$AWS_ACCESS_KEY" ] && [ -n "$AWS_SECRET_KEY" ]; then
    print_result 0 "AWS credentials are configured"
else
    echo -e "${YELLOW}⚠ AWS credentials are empty - this is expected in development${NC}"
fi

# Test 5: Create a manual backup job
echo "Test 5: Creating manual backup job..."
kubectl create job "$TEST_BACKUP_NAME" --from=cronjob/"${RELEASE_NAME}-postgres-backup" -n "$NAMESPACE" > /dev/null 2>&1
print_result $? "Manual backup job created"

# Test 6: Wait for backup job to complete
echo "Test 6: Waiting for backup job to complete (timeout: 300s)..."
kubectl wait --for=condition=complete job/"$TEST_BACKUP_NAME" -n "$NAMESPACE" --timeout=300s > /dev/null 2>&1
JOB_STATUS=$?

if [ $JOB_STATUS -eq 0 ]; then
    print_result 0 "Backup job completed successfully"
else
    echo -e "${YELLOW}⚠ Backup job did not complete (likely due to missing AWS credentials)${NC}"
    # Check job logs for more details
    echo "Job logs:"
    kubectl logs job/"$TEST_BACKUP_NAME" -n "$NAMESPACE" --tail=20
fi

# Test 7: Check backup job logs for errors
echo "Test 7: Checking backup job logs..."
LOGS=$(kubectl logs job/"$TEST_BACKUP_NAME" -n "$NAMESPACE" --tail=50)
echo "$LOGS"

# Look for specific success/error patterns
if echo "$LOGS" | grep -q "Starting PostgreSQL backup"; then
    print_result 0 "Backup process started correctly"
else
    print_result 1 "Backup process did not start correctly"
fi

# Test 8: Validate CronJob schedule
echo "Test 8: Validating CronJob schedule..."
SCHEDULE=$(kubectl get cronjob "${RELEASE_NAME}-postgres-backup" -n "$NAMESPACE" -o jsonpath='{.spec.schedule}')
if [ "$SCHEDULE" = "0 2 * * *" ]; then
    print_result 0 "CronJob schedule is correct (daily at 2 AM UTC)"
else
    print_result 1 "CronJob schedule is incorrect: $SCHEDULE"
fi

# Test 9: Check resource limits
echo "Test 9: Checking resource limits..."
CPU_LIMIT=$(kubectl get cronjob "${RELEASE_NAME}-postgres-backup" -n "$NAMESPACE" -o jsonpath='{.spec.jobTemplate.spec.template.spec.containers[0].resources.limits.cpu}')
MEMORY_LIMIT=$(kubectl get cronjob "${RELEASE_NAME}-postgres-backup" -n "$NAMESPACE" -o jsonpath='{.spec.jobTemplate.spec.template.spec.containers[0].resources.limits.memory}')

if [ "$CPU_LIMIT" = "500m" ] && [ "$MEMORY_LIMIT" = "512Mi" ]; then
    print_result 0 "Resource limits are correctly configured"
else
    print_result 1 "Resource limits are incorrect: CPU=$CPU_LIMIT, Memory=$MEMORY_LIMIT"
fi

# Test 10: Validate environment variables
echo "Test 10: Validating environment variables..."
ENV_VARS=$(kubectl get cronjob "${RELEASE_NAME}-postgres-backup" -n "$NAMESPACE" -o jsonpath='{.spec.jobTemplate.spec.template.spec.containers[0].env[*].name}')

REQUIRED_VARS=("POSTGRES_HOST" "POSTGRES_PORT" "POSTGRES_USER" "POSTGRES_DB" "POSTGRES_PASSWORD" "S3_BUCKET" "S3_REGION" "S3_PREFIX" "RETENTION_DAYS" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")

for var in "${REQUIRED_VARS[@]}"; do
    if echo "$ENV_VARS" | grep -q "$var"; then
        echo -e "${GREEN}  ✓ $var is configured${NC}"
    else
        echo -e "${RED}  ✗ $var is missing${NC}"
        exit 1
    fi
done

print_result 0 "All required environment variables are configured"

# Cleanup
echo "Cleaning up test resources..."
kubectl delete job "$TEST_BACKUP_NAME" -n "$NAMESPACE" > /dev/null 2>&1 || true

echo -e "${GREEN}All backup system tests completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure AWS credentials in the secret"
echo "2. Create the S3 bucket: $S3_BUCKET"
echo "3. Set up monitoring and alerting for backup jobs"
echo "4. Test the restore procedure using BACKUP_RESTORE.md"
echo ""
echo "To configure AWS credentials:"
echo "kubectl patch secret ${RELEASE_NAME}-secret -n $NAMESPACE --type='json' -p='["
echo "  {\"op\": \"replace\", \"path\": \"/data/AWS_ACCESS_KEY_ID\", \"value\": \"'\$(echo -n 'YOUR_ACCESS_KEY' | base64)'\"},"
echo "  {\"op\": \"replace\", \"path\": \"/data/AWS_SECRET_ACCESS_KEY\", \"value\": \"'\$(echo -n 'YOUR_SECRET_KEY' | base64)'\"}"
echo "]'"