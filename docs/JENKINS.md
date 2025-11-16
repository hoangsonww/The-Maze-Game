# Jenkins CI/CD Pipeline Documentation

## Overview
This Jenkinsfile implements a comprehensive CI/CD pipeline for The Maze Game project using Jenkins.

## Prerequisites

### Jenkins Setup
1. Install Jenkins (latest LTS version)
2. Install required plugins:
   - NodeJS Plugin
   - Docker Pipeline Plugin
   - SSH Agent Plugin
   - Slack Notification Plugin (optional)
   - HTML Publisher Plugin
   - JUnit Plugin

### Configure Jenkins Tools
1. **NodeJS Installation**
   - Go to: Manage Jenkins → Global Tool Configuration
   - Add NodeJS installation named "NodeJS 16"
   - Version: 16.x

2. **Docker**
   - Ensure Docker is installed on Jenkins agent
   - Add Docker credentials to Jenkins

### Configure Credentials
Add the following credentials in Jenkins:
- `docker-hub-credentials`: Docker Hub username/password
- `postgres-credentials`: PostgreSQL username/password
- `sentry-dsn`: Sentry DSN token
- `dev-server-ssh`: SSH key for development server
- `staging-server-ssh`: SSH key for staging server
- `prod-server-ssh`: SSH key for production server
- `slack-token`: Slack webhook token (optional)

## Pipeline Stages

### 1. Checkout
- Pulls the latest code from repository
- Captures Git commit hash

### 2. Environment Setup
- Verifies Node.js installation
- Copies environment configuration

### 3. Install Dependencies
- Runs `npm ci` for clean install
- Uses cached node_modules when possible

### 4. Lint
- Runs ESLint on codebase
- Continues even if linting fails

### 5. Run Tests
- **Unit Tests**: Tests client-side code
- **Integration Tests**: Tests server APIs
- Runs in parallel for faster execution
- Publishes coverage reports

### 6. Security Audit
- Runs `npm audit` for dependency vulnerabilities
- Flags moderate and high severity issues

### 7. Build
- Compiles production build
- Archives artifacts

### 8. Docker Build
- Builds Docker image
- Tags with branch name and build number
- Only on main, develop, and release branches

### 9. Docker Push
- Pushes image to Docker registry
- Tags production image on main branch

### 10. Deploy to Development
- Automatically deploys develop branch
- Uses docker-compose on dev server

### 11. Deploy to Staging
- Automatically deploys main branch
- Runs on staging environment

### 12. Deploy to Production
- **Manual approval required**
- Deploys to production servers
- Includes health check verification

### 13. Database Migrations
- Runs SQL migrations
- Executes on main and develop branches

### 14. Smoke Tests
- Validates deployment
- Checks critical endpoints

### 15. Performance Tests
- Runs load tests using Apache Bench
- Validates response times

## Branch Strategy

### develop
- Automatic deployment to development
- All tests run
- No manual approval needed

### main
- Automatic deployment to staging
- Manual approval for production
- Full test suite
- Performance testing

### release/*
- Docker build only
- No automatic deployment

## Environment Variables

Set these in Jenkins or `.env` file:
- `NODE_ENV`: production/development
- `PORT`: Application port
- `DB_HOST`: Database host
- `REDIS_HOST`: Redis host
- `SENTRY_DSN`: Error tracking

## Notifications

### Slack Integration
- Success notifications on production deployments
- Failure alerts on any build failure
- Configure webhook in Jenkins

## Running Manually

To trigger manually:
1. Go to Jenkins dashboard
2. Select "The Maze Game" job
3. Click "Build Now"
4. For production: Approve deployment when prompted

## Rollback Procedure

If deployment fails:
```bash
# SSH to production server
ssh user@prod-server.com

# Rollback docker containers
cd /opt/maze-game
docker-compose down
docker-compose up -d --force-recreate

# Or rollback to specific version
docker pull maze-game:previous-tag
docker-compose up -d
```

## Monitoring

- **Build Status**: Jenkins dashboard
- **Logs**: Available in Jenkins build console
- **Coverage**: HTML coverage report in build artifacts
- **Performance**: Apache Bench results in build artifacts

## Troubleshooting

### Build Fails on Tests
```bash
# Run tests locally
npm test

# Check coverage
npm test -- --coverage
```

### Docker Build Fails
```bash
# Build locally
docker build -t maze-game:test .

# Check logs
docker logs maze-game
```

### Deployment Fails
```bash
# Check server logs
ssh user@server.com
docker-compose logs -f app

# Check health endpoint
curl http://server.com/api/health
```

## Customization

### Add New Stage
```groovy
stage('Custom Stage') {
    steps {
        echo 'Running custom step...'
        sh 'your-command-here'
    }
}
```

### Change Deployment Strategy
Modify the deploy stages to use:
- Kubernetes (kubectl)
- AWS ECS
- Heroku CLI
- Custom scripts

## Security Best Practices

1. Never commit credentials
2. Use Jenkins credential store
3. Rotate SSH keys regularly
4. Enable branch protection
5. Require code review before merge

## Performance Optimization

1. **Parallel Stages**: Tests run in parallel
2. **Docker Layer Caching**: Speeds up builds
3. **Workspace Cleanup**: Prevents disk bloat
4. **Artifact Archiving**: Only essential files

## Support

For issues:
- Check Jenkins console output
- Review build artifacts
- Check server logs
- Contact DevOps team
