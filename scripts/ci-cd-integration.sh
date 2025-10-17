#!/bin/bash

# 🚀 CollabCanvas CI/CD Integration Script
# Integrates with CI/CD pipelines for automated testing and deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
CI_DIR="$PROJECT_ROOT/.github/workflows"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

# Create directories if they don't exist
mkdir -p "$CI_DIR" "$DEPLOY_DIR"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to create GitHub Actions workflow
create_github_actions_workflow() {
    log_info "Creating GitHub Actions workflow..."
    
    local workflow_file="$CI_DIR/ci-cd-pipeline.yml"
    
    cat > "$workflow_file" << 'EOF'
name: CollabCanvas CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'

jobs:
  # Frontend Tests
  frontend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run TypeScript compilation
      run: npm run build
    
    - name: Run ESLint
      run: npx eslint src --ext .ts,.tsx --max-warnings 0
    
    - name: Run unit tests
      run: npm test -- --coverage --watchAll=false
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/lcov.info
        flags: frontend
        name: frontend-coverage

  # Backend Tests
  backend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
    
    - name: Cache pip dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
        restore-keys: |
          ${{ runner.os }}-pip-
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run Python tests
      run: python -m pytest tests/ -v --cov=app --cov-report=xml
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml
        flags: backend
        name: backend-coverage

  # Integration Tests
  integration-tests:
    runs-on: ubuntu-latest
    needs: [frontend-tests, backend-tests]
    
    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Install backend dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Start backend server
      run: |
        cd backend
        python run.py &
        sleep 10
    
    - name: Start frontend server
      run: |
        cd frontend
        npm run dev &
        sleep 15
    
    - name: Run integration tests
      run: |
        cd frontend
        npx cypress run --spec 'cypress/e2e/authenticated-object-tests.cy.ts,cypress/e2e/multi-user-collaboration.cy.ts,cypress/e2e/auth-error-scenarios.cy.ts' --config-file cypress.config.auth.ts --headless
    
    - name: Generate test reports
      run: |
        cd frontend
        npx cypress run --spec 'cypress/e2e/dev-screenshot-generation.cy.ts' --config-file cypress.config.auth.ts --headless
    
    - name: Upload test artifacts
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-artifacts
        path: |
          frontend/cypress/screenshots/
          frontend/cypress/videos/
          reports/

  # Performance Tests
  performance-tests:
    runs-on: ubuntu-latest
    needs: [integration-tests]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
    
    - name: Install dependencies
      run: |
        cd frontend && npm ci
        cd ../backend && pip install -r requirements.txt
    
    - name: Run performance tests
      run: |
        chmod +x scripts/performance-metrics.sh
        ./scripts/performance-metrics.sh
    
    - name: Upload performance reports
      uses: actions/upload-artifact@v3
      with:
        name: performance-reports
        path: reports/metrics/

  # Security Scan
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  # Build and Deploy
  build-and-deploy:
    runs-on: ubuntu-latest
    needs: [frontend-tests, backend-tests, integration-tests, performance-tests, security-scan]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
    
    - name: Build frontend
      run: |
        cd frontend
        npm ci
        npm run build
    
    - name: Build backend
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment..."
        # Add your deployment commands here
    
    - name: Deploy to production
      run: |
        echo "Deploying to production environment..."
        # Add your deployment commands here

  # Notify on completion
  notify:
    runs-on: ubuntu-latest
    needs: [build-and-deploy]
    if: always()
    
    steps:
    - name: Notify success
      if: needs.build-and-deploy.result == 'success'
      run: |
        echo "✅ Deployment successful!"
        # Add notification logic here (Slack, Discord, etc.)
    
    - name: Notify failure
      if: needs.build-and-deploy.result == 'failure'
      run: |
        echo "❌ Deployment failed!"
        # Add notification logic here (Slack, Discord, etc.)
EOF

    log_success "GitHub Actions workflow created: $workflow_file"
}

# Function to create Docker configuration
create_docker_configuration() {
    log_info "Creating Docker configuration..."
    
    # Frontend Dockerfile
    cat > "$FRONTEND_DIR/Dockerfile" << 'EOF'
# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

    # Backend Dockerfile
    cat > "$BACKEND_DIR/Dockerfile" << 'EOF'
# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5000
CMD ["python", "run.py"]
EOF

    # Docker Compose
    cat > "$PROJECT_ROOT/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
EOF

    # Nginx configuration
    cat > "$FRONTEND_DIR/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /socket.io/ {
            proxy_pass http://backend:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

    log_success "Docker configuration created"
}

# Function to create deployment scripts
create_deployment_scripts() {
    log_info "Creating deployment scripts..."
    
    # Staging deployment script
    cat > "$DEPLOY_DIR/deploy-staging.sh" << 'EOF'
#!/bin/bash

# Staging Deployment Script
set -e

echo "🚀 Deploying to staging environment..."

# Build and push Docker images
docker-compose -f docker-compose.staging.yml build
docker-compose -f docker-compose.staging.yml push

# Deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# Run health checks
echo "🔍 Running health checks..."
sleep 30

if curl -f http://staging.collabcanvas.com/health; then
    echo "✅ Staging deployment successful!"
else
    echo "❌ Staging deployment failed!"
    exit 1
fi
EOF

    # Production deployment script
    cat > "$DEPLOY_DIR/deploy-production.sh" << 'EOF'
#!/bin/bash

# Production Deployment Script
set -e

echo "🚀 Deploying to production environment..."

# Build and push Docker images
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml push

# Deploy to production
docker-compose -f docker-compose.production.yml up -d

# Run health checks
echo "🔍 Running health checks..."
sleep 30

if curl -f https://collabcanvas.com/health; then
    echo "✅ Production deployment successful!"
else
    echo "❌ Production deployment failed!"
    exit 1
fi
EOF

    # Make scripts executable
    chmod +x "$DEPLOY_DIR/deploy-staging.sh"
    chmod +x "$DEPLOY_DIR/deploy-production.sh"
    
    log_success "Deployment scripts created"
}

# Function to create environment configuration
create_environment_configuration() {
    log_info "Creating environment configuration..."
    
    # Staging environment
    cat > "$PROJECT_ROOT/.env.staging" << 'EOF'
# Staging Environment Variables
NODE_ENV=staging
FLASK_ENV=staging
DATABASE_URL=postgresql://user:password@staging-db:5432/collabcanvas_staging
REDIS_URL=redis://staging-redis:6379
FIREBASE_API_KEY=your-staging-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-staging-project
EOF

    # Production environment
    cat > "$PROJECT_ROOT/.env.production" << 'EOF'
# Production Environment Variables
NODE_ENV=production
FLASK_ENV=production
DATABASE_URL=postgresql://user:password@production-db:5432/collabcanvas_production
REDIS_URL=redis://production-redis:6379
FIREBASE_API_KEY=your-production-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-production-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-production-project
EOF

    log_success "Environment configuration created"
}

# Function to create monitoring configuration
create_monitoring_configuration() {
    log_info "Creating monitoring configuration..."
    
    # Prometheus configuration
    cat > "$PROJECT_ROOT/monitoring/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'collabcanvas-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'collabcanvas-frontend'
    static_configs:
      - targets: ['frontend:80']
    metrics_path: '/metrics'
    scrape_interval: 5s
EOF

    # Grafana dashboard
    cat > "$PROJECT_ROOT/monitoring/grafana-dashboard.json" << 'EOF'
{
  "dashboard": {
    "title": "CollabCanvas Monitoring",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "WebSocket Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "websocket_connections_total"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
EOF

    log_success "Monitoring configuration created"
}

# Function to create documentation
create_ci_cd_documentation() {
    log_info "Creating CI/CD documentation..."
    
    cat > "$PROJECT_ROOT/CI_CD_GUIDE.md" << 'EOF'
# 🚀 CollabCanvas CI/CD Guide

## Overview

This guide explains the CI/CD pipeline setup for CollabCanvas, including automated testing, building, and deployment processes.

## Pipeline Stages

### 1. Frontend Tests
- **TypeScript Compilation**: Ensures code compiles without errors
- **ESLint**: Code quality and style checks
- **Unit Tests**: Component and utility function tests
- **Coverage Reports**: Code coverage analysis

### 2. Backend Tests
- **Python Tests**: API and service layer tests
- **Coverage Reports**: Code coverage analysis
- **Dependency Checks**: Security vulnerability scanning

### 3. Integration Tests
- **E2E Tests**: Full application testing with Cypress
- **API Tests**: Backend-frontend integration
- **Database Tests**: Data persistence and retrieval

### 4. Performance Tests
- **Load Testing**: Application performance under load
- **Memory Usage**: Resource consumption monitoring
- **Response Times**: API and WebSocket latency

### 5. Security Scan
- **Vulnerability Scanning**: Dependency and code security
- **SAST**: Static Application Security Testing
- **Dependency Audit**: Known vulnerability checks

### 6. Build and Deploy
- **Docker Build**: Container image creation
- **Staging Deployment**: Automated staging environment updates
- **Production Deployment**: Production environment updates

## Local Development

### Running Tests Locally

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
python -m pytest tests/

# E2E tests
cd frontend
npx cypress run
```

### Running Performance Tests

```bash
# Run performance metrics
./scripts/performance-metrics.sh

# Generate test reports
./scripts/generate-test-report.sh
```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run specific services
docker-compose up frontend backend
```

## Deployment

### Staging Deployment

```bash
# Deploy to staging
./deploy/deploy-staging.sh
```

### Production Deployment

```bash
# Deploy to production
./deploy/deploy-production.sh
```

## Monitoring

### Health Checks

- **Frontend**: `http://localhost:3000/health`
- **Backend**: `http://localhost:5000/health`
- **Database**: Connection and query performance
- **Redis**: Cache performance and memory usage

### Metrics

- **API Response Times**: Average and 95th percentile
- **WebSocket Connections**: Active connection count
- **Error Rates**: 4xx and 5xx error percentages
- **Resource Usage**: CPU, memory, and disk usage

## Troubleshooting

### Common Issues

1. **Test Failures**: Check logs for specific error messages
2. **Build Failures**: Verify dependencies and environment variables
3. **Deployment Issues**: Check service health and connectivity
4. **Performance Issues**: Monitor resource usage and bottlenecks

### Debug Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs [service-name]

# Restart services
docker-compose restart [service-name]
```

## Best Practices

1. **Always run tests locally before pushing**
2. **Use meaningful commit messages**
3. **Keep dependencies updated**
4. **Monitor performance metrics**
5. **Review security scan results**
6. **Test in staging before production**

## Support

For issues or questions about the CI/CD pipeline, please:
1. Check the logs for error messages
2. Review the troubleshooting section
3. Create an issue in the project repository
4. Contact the development team
EOF

    log_success "CI/CD documentation created"
}

# Main function
main() {
    log_info "🚀 Setting up CollabCanvas CI/CD Integration"
    log_info "Project Root: $PROJECT_ROOT"
    log_info "CI Directory: $CI_DIR"
    log_info "Deploy Directory: $DEPLOY_DIR"
    
    # Create CI/CD components
    create_github_actions_workflow
    create_docker_configuration
    create_deployment_scripts
    create_environment_configuration
    create_monitoring_configuration
    create_ci_cd_documentation
    
    log_success "🎉 CI/CD integration setup completed!"
    log_info "📋 Created Components:"
    echo -e "  ${BLUE}•${NC} GitHub Actions workflow"
    echo -e "  ${BLUE}•${NC} Docker configuration"
    echo -e "  ${BLUE}•${NC} Deployment scripts"
    echo -e "  ${BLUE}•${NC} Environment configuration"
    echo -e "  ${BLUE}•${NC} Monitoring setup"
    echo -e "  ${BLUE}•${NC} CI/CD documentation"
    echo ""
    log_info "🚀 Next Steps:"
    echo -e "  ${BLUE}•${NC} Configure environment variables"
    echo -e "  ${BLUE}•${NC} Set up deployment targets"
    echo -e "  ${BLUE}•${NC} Configure monitoring dashboards"
    echo -e "  ${BLUE}•${NC} Test the pipeline"
}

# Run main function
main "$@"
