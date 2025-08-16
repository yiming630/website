# Deployment Guide

## Overview

This guide covers deployment strategies for the Translation Platform across different environments and infrastructure setups.

## 1. Environment Setup

### Development Environment
```bash
# Quick start for development
git clone https://github.com/your-org/translation-platform.git
cd translation-platform
cp config/environments/development.env .env
docker-compose up -d

# Verify deployment
curl http://localhost:3000/health
curl http://localhost:4000/health
```

### Staging Environment
```bash
# Staging deployment with production-like settings
cp config/environments/staging.env .env
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Production Environment
```bash
# Production deployment
cp config/environments/production.env .env
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 2. Docker Deployment

### Multi-Environment Docker Compose

#### Base Configuration (docker-compose.yml)
```yaml
# Already exists - base configuration for all environments
version: '3.8'
services:
  # Base service definitions
```

#### Staging Override (docker-compose.staging.yml)
```yaml
version: '3.8'
services:
  db:
    environment:
      POSTGRES_DB: translation_platform_staging
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data

  api-gateway:
    environment:
      NODE_ENV: staging
      LOG_LEVEL: info
    restart: unless-stopped

  frontend:
    environment:
      NODE_ENV: staging
      NEXT_PUBLIC_API_URL: https://staging-api.translation-platform.com

  # Add SSL termination
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/staging.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - api-gateway

volumes:
  postgres_staging_data:
```

#### Production Override (docker-compose.prod.yml)
```yaml
version: '3.8'
services:
  db:
    environment:
      POSTGRES_DB: translation_platform_prod
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1'
        reservations:
          memory: 1G
          cpus: '0.5'

  api-gateway:
    environment:
      NODE_ENV: production
      LOG_LEVEL: warn
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

  frontend:
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.translation-platform.com
    restart: always
    deploy:
      replicas: 2

  # Production nginx with SSL
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/production.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - /var/log/nginx:/var/log/nginx
    restart: always

  # Add Redis for production caching
  redis:
    profiles: [] # Enable by default in production
    restart: always

volumes:
  postgres_prod_data:
    external: true
```

### Nginx Configuration

#### Staging Nginx (nginx/staging.conf)
```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream api {
        server api-gateway:4000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name staging.translation-platform.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name staging.translation-platform.com;

        ssl_certificate /etc/ssl/certs/staging.crt;
        ssl_certificate_key /etc/ssl/certs/staging.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API
        location /api/ {
            proxy_pass http://api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support for real-time features
        location /ws {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

## 3. Kubernetes Deployment

### Namespace and ConfigMap
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: translation-platform

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: translation-platform
data:
  NODE_ENV: "production"
  API_GATEWAY_PORT: "4000"
  USER_SVC_PORT: "4001"
  POSTGRES_PORT: "5432"
  REDIS_PORT: "6379"
```

### Secrets Management
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: translation-platform
type: Opaque
data:
  # Base64 encoded values
  JWT_SECRET: <base64-encoded-jwt-secret>
  JWT_REFRESH_SECRET: <base64-encoded-refresh-secret>
  POSTGRES_PASSWORD: <base64-encoded-db-password>
  GEMINI_API_KEY: <base64-encoded-api-key>
```

### Database Deployment
```yaml
# k8s/postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: translation-platform
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: translation_platform_prod
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: POSTGRES_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: translation-platform
spec:
  ports:
  - port: 5432
    targetPort: 5432
  selector:
    app: postgres
```

### Application Deployments
```yaml
# k8s/api-gateway.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: translation-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: translation-platform/api-gateway:latest
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: NODE_ENV
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: JWT_SECRET
        - name: DB_HOST
          value: postgres
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: POSTGRES_PASSWORD
        ports:
        - containerPort: 4000
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: translation-platform
spec:
  ports:
  - port: 4000
    targetPort: 4000
  selector:
    app: api-gateway
```

### Ingress Configuration
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: translation-platform-ingress
  namespace: translation-platform
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - translation-platform.com
    - api.translation-platform.com
    secretName: translation-platform-tls
  rules:
  - host: translation-platform.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
  - host: api.translation-platform.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 4000
```

## 4. CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run E2E tests
      run: |
        docker-compose -f docker-compose.test.yml up -d
        npm run test:e2e
        docker-compose -f docker-compose.test.yml down

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'

  build:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [frontend, api-gateway, user-service]
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./services/${{ matrix.service }}
        push: ${{ github.event_name != 'pull_request' }}
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to staging
      run: |
        # Update Kubernetes manifests with new image tags
        # Deploy to staging cluster
        echo "Deploying to staging..."

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # Blue-green deployment logic
        echo "Deploying to production..."
```

## 5. Monitoring and Observability

### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'translation-platform'
    static_configs:
      - targets:
        - 'api-gateway:4000'
        - 'user-service:4001'
        - 'frontend:3000'
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Translation Platform Metrics",
    "panels": [
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      }
    ]
  }
}
```

### Application Metrics
```javascript
// services/api-gateway/src/middleware/metrics.js
const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const activeConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

// Middleware to collect metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Metrics endpoint
const metricsEndpoint = (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  httpRequestDuration,
  httpRequestsTotal,
  activeConnections,
};
```

## 6. Health Checks

### Application Health Checks
```javascript
// services/api-gateway/src/routes/health.js
const express = require('express');
const { pool } = require('../utils/database');
const redis = require('../utils/redis');
const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: process.env.npm_package_version,
  });
});

// Detailed readiness check
router.get('/ready', async (req, res) => {
  const checks = {};
  let isReady = true;

  // Database check
  try {
    await pool.query('SELECT 1');
    checks.database = { status: 'healthy', responseTime: 0 };
  } catch (error) {
    checks.database = { status: 'unhealthy', error: error.message };
    isReady = false;
  }

  // Redis check
  try {
    await redis.ping();
    checks.redis = { status: 'healthy' };
  } catch (error) {
    checks.redis = { status: 'unhealthy', error: error.message };
    isReady = false;
  }

  // External service checks
  try {
    // Check if user service is available
    const response = await fetch('http://user-service:4001/health');
    checks.userService = { 
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status 
    };
  } catch (error) {
    checks.userService = { status: 'unhealthy', error: error.message };
    isReady = false;
  }

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
  // Check if application is running properly
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.status(200).json({
    status: 'alive',
    uptime,
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
```

## 7. Backup and Recovery

### Database Backup Script
```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-translation_platform_prod}
DB_USER=${DB_USER:-postgres}
BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo "Starting database backup..."

# Create backup
PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  --verbose \
  --clean \
  --if-exists \
  --create \
  --format=custom \
  --file=$BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

echo "Backup completed: ${BACKUP_FILE}.gz"

# Upload to cloud storage (example with AWS S3)
if [ ! -z "$AWS_S3_BUCKET" ]; then
  aws s3 cp "${BACKUP_FILE}.gz" "s3://$AWS_S3_BUCKET/database-backups/"
  echo "Backup uploaded to S3"
fi

# Clean up old backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Old backups cleaned up"
```

### Automated Backup with Cron
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * /app/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

## 8. SSL/TLS Configuration

### Let's Encrypt with Certbot
```bash
#!/bin/bash
# scripts/setup-ssl.sh

# Install certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx \
  -d translation-platform.com \
  -d api.translation-platform.com \
  -d staging.translation-platform.com \
  --non-interactive \
  --agree-tos \
  --email admin@translation-platform.com

# Set up automatic renewal
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

echo "SSL certificates configured"
```

## 9. Rollback Strategy

### Blue-Green Deployment Script
```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -e

NAMESPACE="translation-platform"
NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

echo "Starting blue-green deployment for version $NEW_VERSION"

# Determine current active environment
CURRENT_ACTIVE=$(kubectl get service frontend-active -n $NAMESPACE -o jsonpath='{.spec.selector.version}')
echo "Current active version: $CURRENT_ACTIVE"

# Determine target environment
if [ "$CURRENT_ACTIVE" = "blue" ]; then
  TARGET_ENV="green"
else
  TARGET_ENV="blue"
fi

echo "Deploying to $TARGET_ENV environment"

# Update deployment with new version
kubectl set image deployment/frontend-$TARGET_ENV \
  frontend=translation-platform/frontend:$NEW_VERSION \
  -n $NAMESPACE

kubectl set image deployment/api-gateway-$TARGET_ENV \
  api-gateway=translation-platform/api-gateway:$NEW_VERSION \
  -n $NAMESPACE

# Wait for rollout to complete
kubectl rollout status deployment/frontend-$TARGET_ENV -n $NAMESPACE
kubectl rollout status deployment/api-gateway-$TARGET_ENV -n $NAMESPACE

# Run health checks
echo "Running health checks..."
sleep 30

# Check if services are healthy
HEALTH_CHECK=$(kubectl exec -n $NAMESPACE deployment/frontend-$TARGET_ENV -- curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ "$HEALTH_CHECK" = "200" ]; then
  echo "Health check passed. Switching traffic to $TARGET_ENV"
  
  # Switch active service to point to new environment
  kubectl patch service frontend-active -n $NAMESPACE -p '{"spec":{"selector":{"version":"'$TARGET_ENV'"}}}'
  kubectl patch service api-gateway-active -n $NAMESPACE -p '{"spec":{"selector":{"version":"'$TARGET_ENV'"}}}'
  
  echo "Deployment completed successfully"
else
  echo "Health check failed. Rolling back..."
  kubectl rollout undo deployment/frontend-$TARGET_ENV -n $NAMESPACE
  kubectl rollout undo deployment/api-gateway-$TARGET_ENV -n $NAMESPACE
  exit 1
fi
```

### Rollback Script
```bash
#!/bin/bash
# scripts/rollback.sh

set -e

NAMESPACE="translation-platform"

echo "Starting rollback..."

# Get current active environment
CURRENT_ACTIVE=$(kubectl get service frontend-active -n $NAMESPACE -o jsonpath='{.spec.selector.version}')
echo "Current active: $CURRENT_ACTIVE"

# Switch to the other environment
if [ "$CURRENT_ACTIVE" = "blue" ]; then
  ROLLBACK_TO="green"
else
  ROLLBACK_TO="blue"
fi

echo "Rolling back to $ROLLBACK_TO"

# Switch traffic back
kubectl patch service frontend-active -n $NAMESPACE -p '{"spec":{"selector":{"version":"'$ROLLBACK_TO'"}}}'
kubectl patch service api-gateway-active -n $NAMESPACE -p '{"spec":{"selector":{"version":"'$ROLLBACK_TO'"}}}'

echo "Rollback completed"
```

## 10. Deployment Checklist

### Pre-Deployment Checklist
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed
- [ ] Performance benchmarks meet requirements
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Monitoring and alerting configured
- [ ] Backup procedures in place
- [ ] Rollback plan prepared

### Post-Deployment Checklist
- [ ] Application health checks passing
- [ ] All services responding correctly
- [ ] Database connectivity verified
- [ ] External integrations working
- [ ] Monitoring dashboards showing expected metrics
- [ ] Error rates within acceptable limits
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] Logs being collected properly
- [ ] Backup verification completed

### Emergency Procedures
- **Service Down**: Check health endpoints, review logs, restart if necessary
- **Database Issues**: Check connection, verify queries, restore from backup if needed
- **Performance Degradation**: Scale services, check resource usage, analyze slow queries
- **Security Incident**: Isolate affected services, review access logs, apply patches
- **Data Loss**: Restore from latest backup, verify data integrity, update application state