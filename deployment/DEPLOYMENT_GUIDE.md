# UMP Production Deployment Guide

This guide covers deploying the Unified Management Platform (UMP) to production environments using various hosting platforms.

## Prerequisites

- Docker and Docker Compose installed
- Kubernetes cluster (for K8s deployment)
- Domain name configured
- SSL certificates (Let's Encrypt recommended)
- Required environment variables and secrets

## Deployment Options

### 1. Kubernetes Deployment (Recommended)

#### Prerequisites

- Kubernetes cluster (1.19+)
- Helm 3.x
- kubectl configured
- Ingress controller (nginx recommended)
- Cert-manager for SSL certificates

#### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd ump

# Install dependencies
helm dependency update ./infra/k8s

# Deploy to production
helm upgrade --install ump ./infra/k8s \
  --namespace ump-production \
  --create-namespace \
  --values ./infra/k8s/values.production.yaml \
  --set secrets.jwtSecret="your-jwt-secret" \
  --set secrets.clerkPublishableKey="your-clerk-key" \
  --set secrets.clerkSecretKey="your-clerk-secret" \
  --set ingress.host="your-domain.com" \
  --wait --timeout=10m
```

#### Production Configuration

1. **Update values.production.yaml**:

   ```yaml
   ingress:
     host: 'your-domain.com'
   secrets:
     jwtSecret: 'your-secure-jwt-secret'
     clerkPublishableKey: 'pk_live_...'
     clerkSecretKey: 'sk_live_...'
   ```

2. **Deploy with custom values**:
   ```bash
   helm upgrade --install ump ./infra/k8s \
     --namespace ump-production \
     --values ./infra/k8s/values.production.yaml
   ```

### 2. AWS EKS Deployment

#### Prerequisites

- AWS CLI configured
- eksctl installed
- kubectl installed

#### Setup EKS Cluster

```bash
# Create EKS cluster
eksctl create cluster \
  --name ump-production \
  --region us-east-1 \
  --nodegroup-name workers \
  --node-type m5.large \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed

# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

# Install nginx ingress controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

#### Deploy UMP

```bash
# Deploy UMP
helm upgrade --install ump ./infra/k8s \
  --namespace ump-production \
  --create-namespace \
  --values ./infra/k8s/values.production.yaml \
  --set ingress.annotations."kubernetes\.io/ingress\.class"="nginx" \
  --set ingress.annotations."cert-manager\.io/cluster-issuer"="letsencrypt-prod"
```

### 3. Google GKE Deployment

#### Prerequisites

- Google Cloud SDK installed
- kubectl configured

#### Setup GKE Cluster

```bash
# Create GKE cluster
gcloud container clusters create ump-production \
  --zone us-central1-a \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 10 \
  --machine-type n1-standard-2

# Get credentials
gcloud container clusters get-credentials ump-production --zone us-central1-a

# Install nginx ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### 4. Azure AKS Deployment

#### Prerequisites

- Azure CLI installed
- kubectl configured

#### Setup AKS Cluster

```bash
# Create resource group
az group create --name ump-production --location eastus

# Create AKS cluster
az aks create \
  --resource-group ump-production \
  --name ump-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group ump-production --name ump-cluster

# Install nginx ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --create-namespace \
  --namespace ingress-nginx
```

### 5. Docker Compose Deployment

For smaller deployments or development environments:

```bash
# Copy production environment file
cp deployment/production.env.template .env.production

# Edit .env.production with your values
vim .env.production

# Deploy with Docker Compose
docker-compose -f docker-compose.production.yml up -d
```

### 6. DigitalOcean Kubernetes

#### Prerequisites

- DigitalOcean CLI (doctl) installed
- kubectl configured

#### Setup DOKS Cluster

```bash
# Create cluster
doctl kubernetes cluster create ump-production \
  --region nyc1 \
  --size s-2vcpu-2gb \
  --count 3 \
  --auto-upgrade \
  --surge-upgrade

# Get credentials
doctl kubernetes cluster kubeconfig save ump-production

# Install nginx ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/do/deploy.yaml
```

## Environment Variables

### Required Environment Variables

```bash
# Authentication
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
JWT_SECRET=your-secure-jwt-secret

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://user:password@host:6379

# External Services
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG...

# Monitoring
SENTRY_DSN=https://...
MIXPANEL_TOKEN=...

# File Storage
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=ump-prod-storage
AWS_REGION=us-east-1
```

## SSL/TLS Configuration

### Let's Encrypt with Cert-Manager

1. **Install cert-manager**:

   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

2. **Create ClusterIssuer**:
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       server: https://acme-v02.api.letsencrypt.org/directory
       email: your-email@domain.com
       privateKeySecretRef:
         name: letsencrypt-prod
       solvers:
         - http01:
             ingress:
               class: nginx
   ```

## Database Setup

### PostgreSQL Production Configuration

```sql
-- Create production database
CREATE DATABASE ump_prod;
CREATE USER ump_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ump_prod TO ump_user;

-- Performance tuning
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Reload configuration
SELECT pg_reload_conf();
```

### Database Migrations

```bash
# Run migrations
kubectl exec -it deployment/ump-backend -- npm run migrate:deploy

# Seed production data
kubectl exec -it deployment/ump-backend -- npm run seed:prod
```

## Monitoring and Logging

### Prometheus and Grafana

```bash
# Install kube-prometheus-stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### Centralized Logging with ELK Stack

```bash
# Install Elasticsearch, Logstash, and Kibana
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch --namespace logging --create-namespace
helm install kibana elastic/kibana --namespace logging
helm install filebeat elastic/filebeat --namespace logging
```

## Backup and Recovery

### Automated Database Backups

```bash
# Create backup job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: ump-production
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15-alpine
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: ump-secrets
                  key: postgres-password
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h ump-postgresql -U ump_user ump_prod | \
              gzip > /backup/ump-$(date +%Y%m%d-%H%M%S).sql.gz
              aws s3 cp /backup/ump-$(date +%Y%m%d-%H%M%S).sql.gz \
                s3://ump-prod-backups/postgres-backups/
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            emptyDir: {}
          restartPolicy: OnFailure
EOF
```

## Security Considerations

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ump-network-policy
  namespace: ump-production
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: ump
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
        - protocol: TCP
          port: 4000
        - protocol: TCP
          port: 4001
  egress:
    - to: []
      ports:
        - protocol: TCP
          port: 5432 # PostgreSQL
        - protocol: TCP
          port: 6379 # Redis
        - protocol: TCP
          port: 443 # HTTPS
        - protocol: TCP
          port: 53 # DNS
        - protocol: UDP
          port: 53 # DNS
```

### Pod Security Standards

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ump-production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

## Scaling and Performance

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ump-backend-hpa
  namespace: ump-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ump-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Vertical Pod Autoscaler

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: ump-backend-vpa
  namespace: ump-production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ump-backend
  updatePolicy:
    updateMode: 'Auto'
  resourcePolicy:
    containerPolicies:
      - containerName: backend
        maxAllowed:
          cpu: 2
          memory: 4Gi
        minAllowed:
          cpu: 100m
          memory: 128Mi
```

## Troubleshooting

### Common Issues

1. **Pod not starting**:

   ```bash
   kubectl describe pod <pod-name> -n ump-production
   kubectl logs <pod-name> -n ump-production
   ```

2. **Database connection issues**:

   ```bash
   kubectl exec -it deployment/ump-backend -n ump-production -- \
     psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Ingress not working**:

   ```bash
   kubectl get ingress -n ump-production
   kubectl describe ingress ump -n ump-production
   ```

4. **SSL certificate issues**:
   ```bash
   kubectl get certificates -n ump-production
   kubectl describe certificate ump-tls -n ump-production
   ```

### Health Checks

```bash
# Check all pods
kubectl get pods -n ump-production

# Check services
kubectl get services -n ump-production

# Check ingress
kubectl get ingress -n ump-production

# Test endpoints
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/health
```

## Maintenance

### Rolling Updates

```bash
# Update image tag
helm upgrade ump ./infra/k8s \
  --namespace ump-production \
  --values ./infra/k8s/values.production.yaml \
  --set image.tag="v1.2.3" \
  --wait
```

### Database Maintenance

```bash
# Run VACUUM and ANALYZE
kubectl exec -it deployment/ump-backend -n ump-production -- \
  psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Check database size
kubectl exec -it deployment/ump-backend -n ump-production -- \
  psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('ump_prod'));"
```

## Support

For deployment issues:

1. Check the troubleshooting section above
2. Review logs: `kubectl logs -f deployment/ump-backend -n ump-production`
3. Check resource usage: `kubectl top pods -n ump-production`
4. Contact support with deployment details and error logs

---

**Note**: Replace placeholder values (domains, secrets, etc.) with your actual production values before deployment.
