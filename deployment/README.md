# UMP Deployment Guide

This directory contains all the necessary files and configurations for deploying the Unified Management Platform (UMP) to production environments.

## 📁 Directory Structure

```
deployment/
├── README.md                     # This file
├── DEPLOYMENT_GUIDE.md           # Comprehensive deployment guide
├── HOSTING_PLATFORMS.md          # Platform-specific deployment guides
├── production.env.template       # Production environment variables template
├── docker-compose.production.yml # Production Docker Compose configuration
├── scripts/                      # Deployment and maintenance scripts
│   ├── deploy.sh                # Main deployment automation script
│   ├── backup.sh                # Backup script for production data
│   ├── restore.sh               # Restore script for disaster recovery
│   └── health-check.sh          # Health monitoring script
└── monitoring/                   # Monitoring and observability configs
    ├── prometheus.yml           # Prometheus configuration
    ├── rules/
    │   └── alerts.yml          # Prometheus alerting rules
    └── grafana/
        ├── dashboards/         # Grafana dashboard definitions
        └── provisioning/       # Grafana provisioning configs
```

## 🚀 Quick Start

### 1. Environment Setup

1. Copy the environment template:

   ```bash
   cp production.env.template production.env
   ```

2. Edit `production.env` with your actual values:

   ```bash
   nano production.env
   ```

3. Ensure all required environment variables are set (see [Environment Variables](#environment-variables) section).

### 2. Choose Your Deployment Method

#### Option A: Kubernetes (Recommended for Production)

```bash
# Deploy to Kubernetes
./scripts/deploy.sh production --type=kubernetes
```

#### Option B: Docker Compose

```bash
# Deploy with Docker Compose
./scripts/deploy.sh production --type=docker
```

#### Option C: Cloud Platforms

```bash
# AWS EKS
./scripts/deploy.sh production --type=aws

# Google GKE
./scripts/deploy.sh production --type=gcp

# Azure AKS
./scripts/deploy.sh production --type=azure
```

## 📋 Prerequisites

### System Requirements

- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: 100GB+ SSD
- **Network**: Stable internet connection

### Software Dependencies

#### For Kubernetes Deployments

- `kubectl` (v1.20+)
- `helm` (v3.0+)
- `docker` (v20.0+)

#### For Docker Compose Deployments

- `docker` (v20.0+)
- `docker-compose` (v1.29+)

#### For Cloud Deployments

- **AWS**: `aws-cli` (v2.0+)
- **GCP**: `gcloud` CLI
- **Azure**: `az` CLI

#### Common Tools

- `git`
- `curl`
- `jq`
- `bash` (v4.0+)

## 🔧 Configuration

### Environment Variables

The following environment variables are required for production deployment:

#### Core Configuration

```bash
# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_DB=ump_prod
POSTGRES_USER=ump
POSTGRES_PASSWORD=your-secure-password

# Cache
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Authentication
JWT_SECRET=your-jwt-secret
CLERK_SECRET_KEY=your-clerk-secret
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

#### External Services

```bash
# OpenAI
OPENAI_API_KEY=your-openai-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-s3-bucket
AWS_REGION=us-west-2
```

For a complete list of environment variables, see `production.env.template`.

### SSL/TLS Configuration

For production deployments, SSL/TLS is mandatory:

1. **Automatic SSL with Let's Encrypt** (Recommended):

   ```yaml
   # In Kubernetes values file
   ingress:
     annotations:
       cert-manager.io/cluster-issuer: 'letsencrypt-prod'
   ```

2. **Custom SSL Certificates**:
   ```bash
   kubectl create secret tls ump-tls \
     --cert=path/to/tls.crt \
     --key=path/to/tls.key \
     --namespace=ump-prod
   ```

## 🛠️ Deployment Scripts

### Main Deployment Script (`deploy.sh`)

The primary deployment automation script with the following features:

- **Multi-platform support**: Kubernetes, Docker, AWS, GCP, Azure
- **Environment validation**: Checks all required variables
- **Pre-deployment testing**: Runs test suite before deployment
- **Automatic backups**: Creates backups before deployment
- **Health checks**: Validates deployment success
- **Rollback capability**: Automatic rollback on failure
- **Notifications**: Slack/email notifications

#### Usage Examples

```bash
# Basic deployment
./scripts/deploy.sh production

# Kubernetes deployment with custom tag
./scripts/deploy.sh production --type=kubernetes --tag=v1.2.3

# Dry run (show what would be done)
./scripts/deploy.sh production --dry-run

# Skip tests and backup
./scripts/deploy.sh production --skip-tests --skip-backup

# Verbose output
./scripts/deploy.sh production --verbose
```

### Backup Script (`backup.sh`)

Comprehensive backup solution supporting:

- **Database backups**: PostgreSQL and Redis
- **File system backups**: Uploads and configurations
- **Cloud storage**: Automatic S3 upload
- **Retention policies**: Automatic cleanup of old backups
- **Compression**: Efficient storage with gzip

#### Usage Examples

```bash
# Full backup
./scripts/backup.sh --type=full

# Database only
./scripts/backup.sh --type=database

# Files only
./scripts/backup.sh --type=files

# Custom retention (keep 30 days)
./scripts/backup.sh --retention=30
```

### Restore Script (`restore.sh`)

Disaster recovery script with:

- **Selective restore**: Database, files, or full restore
- **Source flexibility**: Local files or S3 backups
- **Safety checks**: Confirmation prompts and validation
- **Service management**: Automatic service stop/start

#### Usage Examples

```bash
# Restore from local backup
./scripts/restore.sh --source=local --file=/path/to/backup.tar.gz

# Restore from S3
./scripts/restore.sh --source=s3 --file=backup-20240101-120000.tar.gz

# Database only restore
./scripts/restore.sh --type=database --file=db-backup.sql
```

### Health Check Script (`health-check.sh`)

Comprehensive monitoring script that checks:

- **System resources**: CPU, memory, disk usage
- **Database connectivity**: PostgreSQL and Redis
- **Service health**: All UMP microservices
- **External dependencies**: Third-party APIs
- **SSL certificates**: Expiration monitoring
- **File system**: Directory permissions and space

#### Usage Examples

```bash
# Basic health check
./scripts/health-check.sh

# JSON output for monitoring systems
./scripts/health-check.sh --format=json

# Verbose output
./scripts/health-check.sh --verbose

# Custom timeout
./scripts/health-check.sh --timeout=60
```

## 📊 Monitoring and Observability

### Prometheus Configuration

The `monitoring/prometheus.yml` file includes:

- **Application metrics**: UMP service metrics
- **Infrastructure metrics**: Kubernetes, Docker, system metrics
- **Database metrics**: PostgreSQL and Redis monitoring
- **External service monitoring**: Third-party API health

### Grafana Dashboards

Pre-configured dashboards for:

- **UMP Overview**: High-level application metrics
- **Database Monitoring**: PostgreSQL and Redis performance
- **Infrastructure**: System and Kubernetes metrics
- **Business Metrics**: User activity and application usage

### Alerting Rules

Prometheus alerting rules cover:

- **Application issues**: High error rates, slow responses
- **Infrastructure problems**: Resource exhaustion, service downtime
- **Database issues**: Connection problems, slow queries
- **Security concerns**: Failed authentication, suspicious activity

## 🔒 Security Considerations

### Network Security

1. **Firewall Configuration**:

   - Only expose necessary ports (80, 443)
   - Restrict database access to application servers
   - Use VPC/private networks when possible

2. **TLS/SSL**:
   - Force HTTPS for all traffic
   - Use strong cipher suites
   - Implement HSTS headers

### Application Security

1. **Environment Variables**:

   - Never commit secrets to version control
   - Use secret management systems (Kubernetes secrets, AWS Secrets Manager)
   - Rotate secrets regularly

2. **Container Security**:
   - Use non-root users in containers
   - Scan images for vulnerabilities
   - Keep base images updated

### Database Security

1. **Access Control**:

   - Use strong passwords
   - Limit database user permissions
   - Enable connection encryption

2. **Backup Security**:
   - Encrypt backups at rest
   - Secure backup storage access
   - Test restore procedures regularly

## 🚨 Troubleshooting

### Common Issues

#### Deployment Failures

1. **Image Pull Errors**:

   ```bash
   # Check image exists
   docker pull ghcr.io/ump/backend:latest

   # Verify registry credentials
   kubectl get secret regcred -o yaml
   ```

2. **Database Connection Issues**:

   ```bash
   # Test database connectivity
   kubectl run -it --rm debug --image=postgres:13 --restart=Never -- \
     psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB
   ```

3. **Resource Constraints**:
   ```bash
   # Check resource usage
   kubectl top nodes
   kubectl top pods -n ump-prod
   ```

#### Service Health Issues

1. **Check Pod Status**:

   ```bash
   kubectl get pods -n ump-prod
   kubectl describe pod <pod-name> -n ump-prod
   kubectl logs <pod-name> -n ump-prod
   ```

2. **Check Service Endpoints**:

   ```bash
   kubectl get endpoints -n ump-prod
   kubectl get ingress -n ump-prod
   ```

3. **Database Issues**:

   ```bash
   # Check database logs
   kubectl logs -l app=postgresql -n ump-prod

   # Check Redis logs
   kubectl logs -l app=redis -n ump-prod
   ```

### Log Analysis

1. **Application Logs**:

   ```bash
   # Stream logs from all services
   kubectl logs -f -l app.kubernetes.io/name=ump -n ump-prod

   # Specific service logs
   kubectl logs -f deployment/ump-backend -n ump-prod
   ```

2. **System Logs**:

   ```bash
   # Node logs
   journalctl -u kubelet

   # Docker logs
   journalctl -u docker
   ```

### Performance Issues

1. **Resource Monitoring**:

   ```bash
   # Check resource usage
   kubectl top pods -n ump-prod --sort-by=cpu
   kubectl top pods -n ump-prod --sort-by=memory
   ```

2. **Database Performance**:
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

## 📚 Additional Resources

### Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Comprehensive deployment guide
- [HOSTING_PLATFORMS.md](./HOSTING_PLATFORMS.md) - Platform-specific guides
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Helm Documentation](https://helm.sh/docs/)

### Monitoring and Observability

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Kubernetes Monitoring Guide](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-usage-monitoring/)

### Security

- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Application Security](https://owasp.org/)

## 🆘 Support

For deployment issues or questions:

1. **Check the logs**: Use the troubleshooting section above
2. **Run health checks**: Use `./scripts/health-check.sh`
3. **Review configuration**: Ensure all environment variables are set
4. **Check resources**: Verify system has adequate CPU/memory/disk
5. **Consult documentation**: Review the comprehensive guides

## 📝 Contributing

When contributing to deployment configurations:

1. **Test thoroughly**: Test all changes in a staging environment
2. **Update documentation**: Keep this README and guides current
3. **Follow security practices**: Never commit secrets or sensitive data
4. **Version control**: Tag releases and maintain changelog
5. **Backup before changes**: Always backup before making changes

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintainer**: UMP DevOps Team
