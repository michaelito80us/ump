# UMP Hosting Platform Configurations

This guide provides specific configurations for deploying UMP on various hosting platforms and cloud providers.

## Table of Contents

1. [AWS (Amazon Web Services)](#aws-amazon-web-services)
2. [Google Cloud Platform (GCP)](#google-cloud-platform-gcp)
3. [Microsoft Azure](#microsoft-azure)
4. [DigitalOcean](#digitalocean)
5. [Vercel (Frontend Only)](#vercel-frontend-only)
6. [Railway](#railway)
7. [Render](#render)
8. [Fly.io](#flyio)
9. [Heroku](#heroku)
10. [Self-Hosted Solutions](#self-hosted-solutions)

---

## AWS (Amazon Web Services)

### EKS (Elastic Kubernetes Service) - Recommended

#### Prerequisites

- AWS CLI configured
- eksctl installed
- kubectl installed
- Helm 3.x

#### 1. Create EKS Cluster

```bash
# Create cluster configuration
cat > ump-cluster.yaml <<EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: ump-production
  region: us-east-1
  version: "1.28"

nodeGroups:
  - name: ump-workers
    instanceType: m5.large
    desiredCapacity: 3
    minSize: 2
    maxSize: 10
    volumeSize: 100
    ssh:
      allow: false
    iam:
      withAddonPolicies:
        autoScaler: true
        awsLoadBalancerController: true
        ebs: true
        efs: true
        cloudWatch: true

addons:
  - name: vpc-cni
  - name: coredns
  - name: kube-proxy
  - name: aws-ebs-csi-driver

cloudWatch:
  clusterLogging:
    enable: ["api", "audit", "authenticator", "controllerManager", "scheduler"]
EOF

# Create the cluster
eksctl create cluster -f ump-cluster.yaml
```

#### 2. Install Required Add-ons

```bash
# Install AWS Load Balancer Controller
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"

helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=ump-production \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Install Cluster Autoscaler
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set autoDiscovery.clusterName=ump-production \
  --set awsRegion=us-east-1

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

#### 3. Configure RDS and ElastiCache

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier ump-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username ump_admin \
  --master-user-password "YourSecurePassword" \
  --allocated-storage 100 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name ump-db-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted

# Create ElastiCache Redis cluster
aws elasticache create-replication-group \
  --replication-group-id ump-prod-redis \
  --description "UMP Production Redis" \
  --node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-clusters 2 \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-group-name ump-redis-subnet-group
```

#### 4. Deploy UMP

```bash
# Update values for AWS
helm upgrade --install ump ./infra/k8s \
  --namespace ump-production \
  --create-namespace \
  --values ./infra/k8s/values.production.yaml \
  --set postgresql.enabled=false \
  --set redis.enabled=false \
  --set secrets.postgresUrl="postgresql://ump_admin:YourSecurePassword@ump-prod-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/ump_prod" \
  --set secrets.redisUrl="redis://ump-prod-redis.xxxxxx.cache.amazonaws.com:6379" \
  --set ingress.annotations."kubernetes\.io/ingress\.class"="alb" \
  --set ingress.annotations."alb\.ingress\.kubernetes\.io/scheme"="internet-facing" \
  --set ingress.annotations."alb\.ingress\.kubernetes\.io/target-type"="ip"
```

### ECS (Elastic Container Service)

#### 1. Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name ump-production

# Create task definition
cat > ump-task-definition.json <<EOF
{
  "family": "ump-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "ump-backend",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/ump-backend:latest",
      "portMappings": [
        {
          "containerPort": 4001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:ump/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ump-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

aws ecs register-task-definition --cli-input-json file://ump-task-definition.json
```

---

## Google Cloud Platform (GCP)

### GKE (Google Kubernetes Engine)

#### 1. Create GKE Cluster

```bash
# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com

# Create cluster
gcloud container clusters create ump-production \
  --zone us-central1-a \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 10 \
  --machine-type n1-standard-2 \
  --disk-size 100GB \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-network-policy \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing,NetworkPolicy

# Get credentials
gcloud container clusters get-credentials ump-production --zone us-central1-a
```

#### 2. Configure Cloud SQL and Memorystore

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create ump-prod-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-4096 \
  --region=us-central1 \
  --storage-size=100GB \
  --storage-type=SSD \
  --backup \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=02

# Create database and user
gcloud sql databases create ump_prod --instance=ump-prod-db
gcloud sql users create ump_user --instance=ump-prod-db --password=YourSecurePassword

# Create Memorystore Redis instance
gcloud redis instances create ump-prod-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

### Cloud Run (Serverless)

```bash
# Deploy backend service
gcloud run deploy ump-backend \
  --image gcr.io/PROJECT_ID/ump-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=ump-database-url:latest \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 100 \
  --max-instances 10

# Deploy frontend services
gcloud run deploy ump-admin \
  --image gcr.io/PROJECT_ID/ump-admin:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1
```

---

## Microsoft Azure

### AKS (Azure Kubernetes Service)

#### 1. Create AKS Cluster

```bash
# Create resource group
az group create --name ump-production --location eastus

# Create AKS cluster
az aks create \
  --resource-group ump-production \
  --name ump-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 10 \
  --node-vm-size Standard_D2s_v3 \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group ump-production --name ump-cluster
```

#### 2. Configure Azure Database and Cache

```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group ump-production \
  --name ump-prod-db \
  --location eastus \
  --admin-user ump_admin \
  --admin-password YourSecurePassword \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose \
  --storage-size 128 \
  --version 15

# Create Redis cache
az redis create \
  --resource-group ump-production \
  --name ump-prod-redis \
  --location eastus \
  --sku Standard \
  --vm-size c1
```

### Azure Container Instances (ACI)

```bash
# Create container group
az container create \
  --resource-group ump-production \
  --name ump-backend \
  --image your-registry.azurecr.io/ump-backend:latest \
  --cpu 2 \
  --memory 4 \
  --ports 4001 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables DATABASE_URL=postgresql://... \
  --restart-policy Always
```

---

## DigitalOcean

### DOKS (DigitalOcean Kubernetes)

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

# Create managed database
doctl databases create ump-prod-db \
  --engine pg \
  --version 15 \
  --size db-s-2vcpu-4gb \
  --region nyc1 \
  --num-nodes 1

# Create Redis cluster
doctl databases create ump-prod-redis \
  --engine redis \
  --version 7 \
  --size db-s-1vcpu-1gb \
  --region nyc1 \
  --num-nodes 1
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: ump-production
services:
  - name: backend
    source_dir: apps/backend
    github:
      repo: your-username/ump
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 2
    instance_size_slug: professional-xs
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${ump-prod-db.DATABASE_URL}
      - key: REDIS_URL
        value: ${ump-prod-redis.DATABASE_URL}
    http_port: 4001
    health_check:
      http_path: /health

  - name: admin
    source_dir: apps/admin
    github:
      repo: your-username/ump
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: professional-xs
    envs:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_GRAPHQL_URL
        value: https://ump-production-backend.ondigitalocean.app/graphql
    http_port: 3000

databases:
  - name: ump-prod-db
    engine: PG
    version: '15'
    size: db-s-2vcpu-4gb
    num_nodes: 1

  - name: ump-prod-redis
    engine: REDIS
    version: '7'
    size: db-s-1vcpu-1gb
    num_nodes: 1
```

---

## Vercel (Frontend Only)

### Deploy Admin and Mobile Apps

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy admin app
cd apps/admin
vercel --prod

# Deploy mobile app
cd ../mobile
vercel --prod
```

### vercel.json Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_GRAPHQL_URL": "https://api.yourdomain.com/graphql",
    "NEXT_PUBLIC_WS_URL": "wss://api.yourdomain.com/graphql",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "@clerk_publishable_key"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## Railway

### Deploy with Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add services
railway add --database postgresql
railway add --database redis

# Deploy backend
cd apps/backend
railway up

# Deploy frontend apps
cd ../admin
railway up

cd ../mobile
railway up
```

### railway.json Configuration

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 2,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## Render

### render.yaml Configuration

```yaml
databases:
  - name: ump-prod-db
    databaseName: ump_prod
    user: ump_user
    plan: standard

  - name: ump-prod-redis
    type: redis
    plan: standard

services:
  - type: web
    name: ump-backend
    env: node
    plan: standard
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: ump-prod-db
          property: connectionString
      - key: REDIS_URL
        fromDatabase:
          name: ump-prod-redis
          property: connectionString
    healthCheckPath: /health

  - type: web
    name: ump-admin
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_GRAPHQL_URL
        value: https://ump-backend.onrender.com/graphql

  - type: web
    name: ump-mobile
    env: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_GRAPHQL_URL
        value: https://ump-backend.onrender.com/graphql
```

---

## Fly.io

### fly.toml Configuration

```toml
app = "ump-backend"
primary_region = "iad"

[build]
  dockerfile = "apps/backend/Dockerfile.production"

[env]
  NODE_ENV = "production"
  PORT = "4001"

[http_service]
  internal_port = 4001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  path = "/health"
  protocol = "http"
  timeout = "5s"

[machine]
  memory = "2gb"
  cpu_kind = "shared"
  cpus = 2

[[services]]
  protocol = "tcp"
  internal_port = 4001
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

[[services.tcp_checks]]
  grace_period = "10s"
  interval = "15s"
  restart_limit = 0
  timeout = "2s"
```

### Deploy Commands

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and create apps
fly auth login
fly apps create ump-backend
fly apps create ump-admin
fly apps create ump-mobile

# Create databases
fly postgres create --name ump-prod-db
fly redis create --name ump-prod-redis

# Deploy services
fly deploy --app ump-backend
fly deploy --app ump-admin
fly deploy --app ump-mobile
```

---

## Heroku

### Procfile

```
web: npm start
worker: npm run worker
release: npm run migrate:deploy
```

### Deploy Commands

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create apps
heroku login
heroku create ump-backend-prod
heroku create ump-admin-prod
heroku create ump-mobile-prod

# Add databases
heroku addons:create heroku-postgresql:standard-0 --app ump-backend-prod
heroku addons:create heroku-redis:premium-0 --app ump-backend-prod

# Set environment variables
heroku config:set NODE_ENV=production --app ump-backend-prod
heroku config:set JWT_SECRET=your-jwt-secret --app ump-backend-prod

# Deploy
git push heroku main
```

---

## Self-Hosted Solutions

### Docker Swarm

```yaml
# docker-stack.yml
version: '3.8'

services:
  backend:
    image: your-registry.com/ump-backend:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    networks:
      - ump-network
    secrets:
      - database_url
      - jwt_secret

  admin:
    image: your-registry.com/ump-admin:latest
    deploy:
      replicas: 2
    networks:
      - ump-network

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    deploy:
      replicas: 2
    networks:
      - ump-network
    configs:
      - source: nginx_config
        target: /etc/nginx/nginx.conf

networks:
  ump-network:
    driver: overlay
    attachable: true

secrets:
  database_url:
    external: true
  jwt_secret:
    external: true

configs:
  nginx_config:
    external: true
```

### Deploy with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Create secrets
echo "postgresql://..." | docker secret create database_url -
echo "your-jwt-secret" | docker secret create jwt_secret -

# Create config
docker config create nginx_config ./deployment/nginx/nginx.conf

# Deploy stack
docker stack deploy -c docker-stack.yml ump
```

### Kubernetes with kubeadm

```bash
# Initialize cluster
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Install CNI plugin
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

# Join worker nodes
sudo kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash <hash>

# Deploy UMP
helm upgrade --install ump ./infra/k8s \
  --namespace ump-production \
  --create-namespace \
  --values ./infra/k8s/values.production.yaml
```

---

## Cost Optimization Tips

### 1. Resource Right-Sizing

- Start with smaller instances and scale up based on metrics
- Use burstable instances for variable workloads
- Implement horizontal pod autoscaling

### 2. Reserved Instances/Committed Use

- AWS Reserved Instances (1-3 year terms)
- GCP Committed Use Discounts
- Azure Reserved VM Instances

### 3. Spot/Preemptible Instances

- Use for non-critical workloads
- Implement proper graceful shutdown handling
- Mix with on-demand instances for reliability

### 4. Storage Optimization

- Use appropriate storage classes
- Implement lifecycle policies for backups
- Compress and archive old data

### 5. Network Optimization

- Use CDN for static assets
- Implement proper caching strategies
- Optimize data transfer between regions

---

## Monitoring and Alerting

### Platform-Specific Monitoring

#### AWS

- CloudWatch for metrics and logs
- X-Ray for distributed tracing
- AWS Config for compliance

#### GCP

- Cloud Monitoring (Stackdriver)
- Cloud Trace for performance
- Cloud Logging for centralized logs

#### Azure

- Azure Monitor
- Application Insights
- Log Analytics

### Universal Monitoring Stack

```yaml
# monitoring-stack.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
---
# Prometheus, Grafana, AlertManager deployment
# (Use kube-prometheus-stack Helm chart)
```

---

## Security Best Practices

### 1. Network Security

- Use private subnets for databases
- Implement network policies
- Enable VPC flow logs

### 2. Identity and Access Management

- Use service accounts with minimal permissions
- Implement RBAC in Kubernetes
- Rotate credentials regularly

### 3. Secrets Management

- Use platform-native secret stores
- Encrypt secrets at rest and in transit
- Implement secret rotation

### 4. Container Security

- Scan images for vulnerabilities
- Use distroless or minimal base images
- Run containers as non-root users

### 5. Compliance

- Enable audit logging
- Implement data encryption
- Regular security assessments

---

## Disaster Recovery

### 1. Backup Strategy

- Automated database backups
- Cross-region backup replication
- Regular backup testing

### 2. High Availability

- Multi-AZ deployments
- Load balancing across zones
- Database read replicas

### 3. Recovery Procedures

- Document recovery steps
- Test recovery procedures
- Implement automated failover

---

Choose the hosting platform that best fits your requirements in terms of cost, scalability, compliance, and operational complexity. Each platform has its strengths and trade-offs.
