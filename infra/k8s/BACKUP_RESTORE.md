# PostgreSQL Backup and Restore Strategy

This document describes the automated backup strategy and manual restore procedures for the UMP PostgreSQL database.

## Backup Strategy

### Automated Daily Backups

- **Schedule**: Daily at 2:00 AM UTC
- **Storage**: AWS S3 with Standard-IA storage class
- **Format**: PostgreSQL custom format with compression (level 9)
- **Retention**: 30 days (configurable via `backup.retention.days`)
- **Naming**: `postgres-backup-YYYYMMDD-HHMMSS.sql`

### Configuration

Backup settings are configured in `values.yaml`:

```yaml
backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM UTC
  retention:
    days: 30
  s3:
    bucket: "ump-backups"
    region: "us-east-1"
    prefix: "postgres-backups"
```

### Required Secrets

The following secrets must be configured for backup functionality:

```bash
# Set AWS credentials for S3 access
kubectl create secret generic ump-secret \
  --from-literal=AWS_ACCESS_KEY_ID="your-access-key" \
  --from-literal=AWS_SECRET_ACCESS_KEY="your-secret-key" \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Restore Procedures

### Prerequisites

1. Access to the Kubernetes cluster
2. AWS CLI configured with S3 access
3. PostgreSQL client tools (`psql`, `pg_restore`)

### Step 1: List Available Backups

```bash
# List all available backups
aws s3 ls s3://ump-backups/postgres-backups/ --region us-east-1

# Example output:
# 2024-01-15 02:00:00  12345678 postgres-backup-20240115-020000.sql
# 2024-01-14 02:00:00  12234567 postgres-backup-20240114-020000.sql
```

### Step 2: Download Backup File

```bash
# Download the desired backup file
BACKUP_FILE="postgres-backup-20240115-020000.sql"
aws s3 cp "s3://ump-backups/postgres-backups/$BACKUP_FILE" "./$BACKUP_FILE" --region us-east-1
```

### Step 3: Scale Down Applications

```bash
# Scale down all applications to prevent database connections
kubectl scale deployment ump-backend --replicas=0
kubectl scale deployment ump-gateway --replicas=0
kubectl scale deployment ump-admin --replicas=0
kubectl scale deployment ump-mobile --replicas=0

# Wait for pods to terminate
kubectl wait --for=delete pod -l app.kubernetes.io/name=ump --timeout=300s
```

### Step 4: Create Restore Pod

```bash
# Create a temporary pod for restore operations
kubectl run postgres-restore \
  --image=postgres:15-alpine \
  --rm -i --tty \
  --env="PGPASSWORD=ump_password" \
  --command -- /bin/sh
```

### Step 5: Copy Backup to Restore Pod

```bash
# In another terminal, copy the backup file to the restore pod
kubectl cp "./$BACKUP_FILE" postgres-restore:/tmp/backup.sql
```

### Step 6: Perform Database Restore

```bash
# Inside the restore pod, perform the restore
# First, drop and recreate the database
psql -h ump-postgres -U ump_user -d postgres -c "DROP DATABASE IF EXISTS ump_prod;"
psql -h ump-postgres -U ump_user -d postgres -c "CREATE DATABASE ump_prod;"

# Restore the database from backup
pg_restore -h ump-postgres -U ump_user -d ump_prod \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  /tmp/backup.sql

# Verify the restore
psql -h ump-postgres -U ump_user -d ump_prod -c "\dt"
```

### Step 7: Scale Up Applications

```bash
# Exit the restore pod (it will be automatically deleted)
exit

# Scale applications back up
kubectl scale deployment ump-backend --replicas=2
kubectl scale deployment ump-gateway --replicas=2
kubectl scale deployment ump-admin --replicas=2
kubectl scale deployment ump-mobile --replicas=2

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=ump --timeout=300s
```

### Step 8: Verify Application Health

```bash
# Check application logs
kubectl logs -l app.kubernetes.io/component=backend --tail=50
kubectl logs -l app.kubernetes.io/component=gateway --tail=50

# Test database connectivity
kubectl exec -it deployment/ump-backend -- npm run db:status
```

## Point-in-Time Recovery

For point-in-time recovery, you would need to:

1. Enable PostgreSQL WAL archiving
2. Store WAL files in S3
3. Use `pg_basebackup` for base backups
4. Apply WAL files up to the desired recovery point

*Note: Point-in-time recovery is not currently implemented but can be added as a future enhancement.*

## Monitoring and Alerting

### Backup Job Monitoring

```bash
# Check backup job status
kubectl get cronjobs
kubectl get jobs -l app.kubernetes.io/component=backup

# View backup job logs
kubectl logs -l app.kubernetes.io/component=backup --tail=100
```

### Recommended Alerts

1. **Backup Job Failure**: Alert when backup cron job fails
2. **Missing Backup**: Alert when no backup is created for 25+ hours
3. **S3 Upload Failure**: Alert when backup file upload to S3 fails
4. **Retention Cleanup Failure**: Alert when old backup cleanup fails

## Security Considerations

1. **AWS Credentials**: Use IAM roles or external secret management instead of storing credentials in Kubernetes secrets
2. **Backup Encryption**: Consider encrypting backup files before uploading to S3
3. **Access Control**: Limit S3 bucket access to backup service accounts only
4. **Network Security**: Ensure backup traffic is encrypted in transit

## Troubleshooting

### Common Issues

1. **AWS Credentials Invalid**
   ```bash
   # Test AWS credentials
   kubectl exec -it deployment/ump-backend -- aws s3 ls s3://ump-backups/
   ```

2. **PostgreSQL Connection Failed**
   ```bash
   # Test database connectivity
   kubectl exec -it deployment/ump-postgres -- pg_isready -U ump_user
   ```

3. **Insufficient S3 Permissions**
   - Ensure the AWS user has `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucket` permissions

4. **Backup File Corruption**
   ```bash
   # Verify backup file integrity
   pg_restore --list /path/to/backup.sql
   ```

## Testing the Backup System

### Manual Backup Test

```bash
# Trigger a manual backup job
kubectl create job --from=cronjob/ump-postgres-backup manual-backup-test

# Monitor the job
kubectl logs -f job/manual-backup-test

# Verify backup was created in S3
aws s3 ls s3://ump-backups/postgres-backups/ --region us-east-1
```

### Restore Test

1. Create a test database
2. Restore a backup to the test database
3. Verify data integrity
4. Clean up test resources

Regular testing of the backup and restore procedures is essential to ensure data recovery capabilities.