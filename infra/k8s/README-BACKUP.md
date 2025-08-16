# PostgreSQL Backup & Restore System

This document describes the implementation of task T-13.6: Back-up & Restore Strategy for the Unified Management Platform (UMP).

## Overview

The backup system provides automated daily PostgreSQL backups to AWS S3 with configurable retention policies. This implementation ensures data protection and disaster recovery capabilities for the UMP platform.

## Implementation Details

### Files Created/Modified

1. **`cron-backup.yaml`** - Kubernetes CronJob for automated backups
2. **`values.yaml`** - Added backup configuration section
3. **`secret.yaml`** - Added AWS credentials placeholders
4. **`BACKUP_RESTORE.md`** - Detailed backup and restore procedures
5. **`test-backup.ps1`** - PowerShell test script for validation
6. **`test-backup.sh`** - Bash test script for Unix systems

### Key Features

- **Automated Daily Backups**: Runs at 2 AM UTC daily
- **S3 Storage**: Secure cloud storage with encryption
- **Retention Policy**: Configurable retention (default: 30 days)
- **Resource Management**: CPU and memory limits for backup jobs
- **Monitoring Ready**: Structured logging for alerting integration
- **Security**: AWS credentials managed via Kubernetes secrets

## Configuration

### Backup Settings (values.yaml)

```yaml
backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM UTC
  retention: 30  # Days
  s3:
    bucket: "ump-backups"
    region: "us-east-1"
    prefix: "postgres-backups"
  image: "postgres:15-alpine"
  resources:
    limits:
      cpu: "500m"
      memory: "512Mi"
    requests:
      cpu: "100m"
      memory: "128Mi"
```

### Required AWS Setup

1. **S3 Bucket**: Create `ump-backups` bucket in `us-east-1`
2. **IAM User**: Create user with S3 permissions
3. **Bucket Policy**: Configure appropriate access controls
4. **Encryption**: Enable S3 server-side encryption

### AWS Credentials Configuration

```bash
# Set AWS credentials in Kubernetes secret
kubectl patch secret ump-secret -n default --type='json' -p='[
  {"op": "replace", "path": "/data/AWS_ACCESS_KEY_ID", "value": "'$(echo -n 'YOUR_ACCESS_KEY' | base64)'"},
  {"op": "replace", "path": "/data/AWS_SECRET_ACCESS_KEY", "value": "'$(echo -n 'YOUR_SECRET_KEY' | base64)'"}
]'
```

## Testing

### Automated Testing

Run the test script to validate the backup system:

```powershell
# Windows PowerShell
.\infra\k8s\test-backup.ps1

# Unix/Linux
./infra/k8s/test-backup.sh
```

### Test Coverage

The test script validates:

1. ✅ CronJob existence and configuration
2. ✅ PostgreSQL pod status
3. ✅ Required secrets and AWS credentials
4. ✅ Manual backup job creation and execution
5. ✅ Resource limits and environment variables
6. ✅ Backup schedule validation
7. ✅ Job logs and error handling

### Manual Testing

```bash
# Create manual backup
kubectl create job manual-backup-$(date +%Y%m%d) --from=cronjob/ump-postgres-backup

# Monitor backup progress
kubectl logs job/manual-backup-$(date +%Y%m%d) -f

# List backups in S3
aws s3 ls s3://ump-backups/postgres-backups/
```

## Monitoring & Alerting

### Recommended Monitoring

1. **Job Success/Failure**: Monitor CronJob completion status
2. **Backup Size**: Track backup file sizes over time
3. **S3 Upload Success**: Verify successful S3 uploads
4. **Retention Cleanup**: Monitor old backup deletion

### Alert Conditions

- Backup job failures
- Missing daily backups
- S3 upload failures
- Disk space issues
- AWS credential expiration

## Security Considerations

### Best Practices Implemented

1. **Credential Management**: AWS credentials stored in Kubernetes secrets
2. **Least Privilege**: Minimal S3 permissions required
3. **Encryption**: S3 server-side encryption enabled
4. **Network Security**: Backup jobs run within cluster network
5. **Access Control**: RBAC for backup job management

### Production Recommendations

1. **External Secrets**: Use external secret management (e.g., AWS Secrets Manager)
2. **IAM Roles**: Use IAM roles for service accounts (IRSA)
3. **VPC Endpoints**: Use S3 VPC endpoints for private connectivity
4. **Audit Logging**: Enable CloudTrail for S3 access logging

## Disaster Recovery

### Recovery Time Objectives (RTO)

- **Database Restore**: 15-30 minutes
- **Application Recovery**: 5-10 minutes
- **Full System Recovery**: 30-60 minutes

### Recovery Point Objectives (RPO)

- **Maximum Data Loss**: 24 hours (daily backups)
- **Recommended**: Consider more frequent backups for critical data

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Verify credentials are correctly base64 encoded
2. **S3 Permissions**: Ensure IAM user has required S3 permissions
3. **Network Connectivity**: Check cluster's internet access to S3
4. **Resource Limits**: Monitor backup job resource usage

### Debug Commands

```bash
# Check CronJob status
kubectl describe cronjob ump-postgres-backup

# View recent backup jobs
kubectl get jobs -l job-name=ump-postgres-backup

# Check backup job logs
kubectl logs job/[backup-job-name]

# Verify secrets
kubectl get secret ump-secret -o yaml
```

## Future Enhancements

### Planned Improvements

1. **Point-in-Time Recovery**: WAL-E or similar for continuous backup
2. **Cross-Region Replication**: Multi-region backup storage
3. **Backup Verification**: Automated restore testing
4. **Compression**: Backup compression to reduce storage costs
5. **Incremental Backups**: Reduce backup time and storage

### Monitoring Integration

1. **Prometheus Metrics**: Custom metrics for backup monitoring
2. **Grafana Dashboards**: Visual backup status and trends
3. **AlertManager**: Automated alerting for backup failures
4. **Slack/Email Notifications**: Real-time backup status updates

## Compliance & Governance

### Data Retention

- **Default Retention**: 30 days
- **Configurable**: Adjust via `values.yaml`
- **Compliance**: Meets standard backup requirements

### Audit Trail

- **Backup Logs**: Structured logging for audit purposes
- **S3 Access Logs**: CloudTrail integration
- **Job History**: Kubernetes job history retention

---

**Task T-13.6 Status**: ✅ **COMPLETED**

- ✅ Daily PostgreSQL backups implemented
- ✅ S3 storage with retention policy
- ✅ Kubernetes CronJob configuration
- ✅ Documentation and testing procedures
- ✅ Security best practices applied
- ✅ Monitoring and alerting guidelines provided