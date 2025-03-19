# Klaviyo Analytics Dashboard - Deployment Guide

This document outlines the deployment process for the Klaviyo Analytics Dashboard, including both development and production environments.

## Development Deployment

The development deployment is automated using GitHub Actions and is triggered whenever code is pushed to the `develop` branch or manually through the GitHub Actions interface.

### Prerequisites

Before deploying to the development environment, ensure the following:

1. All tests pass locally
2. The code has been reviewed by at least one team member
3. The necessary environment variables are configured in GitHub Secrets

### GitHub Secrets Required

The following secrets need to be configured in the GitHub repository settings:

- `KLAVIYO_API_KEY_DEV`: Klaviyo API key for the development environment
- `NEXT_PUBLIC_API_URL_DEV`: URL of the backend API in the development environment
- `SSH_PRIVATE_KEY`: SSH private key for accessing the development server
- `DEV_SERVER_HOST`: Hostname of the development server
- `DEV_SERVER_USER`: Username for SSH access to the development server
- `DEV_SERVER_PATH`: Path on the server where the application should be deployed
- `SLACK_WEBHOOK_URL`: Webhook URL for Slack notifications

### Deployment Process

The development deployment process consists of the following steps:

1. **Test**: Run all backend tests to ensure everything is working correctly
2. **Build**: Build both the backend and frontend applications
3. **Deploy**: Copy the built artifacts to the development server and restart the services
4. **Notify**: Send a notification to Slack about the deployment status

### Manual Deployment

To manually trigger a deployment:

1. Go to the GitHub repository
2. Navigate to the "Actions" tab
3. Select the "Development Deployment" workflow
4. Click "Run workflow"
5. Select the target environment (development or staging)
6. Click "Run workflow" again

### Feature Flags

The development environment supports feature flags to enable or disable specific features. These are configured in the `.env` file on the development server:

```
FEATURE_NEW_METRICS=true
FEATURE_EXPORT_DATA=false
FEATURE_SCHEDULED_REPORTS=false
```

To enable a feature flag:

1. SSH into the development server
2. Edit the `.env` file in the backend directory
3. Set the desired feature flag to `true`
4. Restart the backend service: `pm2 restart klaviyo-api`

## Production Deployment

Production deployments are more controlled and require additional steps to ensure stability and reliability.

### Prerequisites

Before deploying to production:

1. The code must have been deployed to the development environment for at least 24 hours
2. All tests must pass in the CI pipeline
3. The release must be approved by the product owner
4. A release branch must be created from the `develop` branch

### Production Deployment Process

The production deployment process is as follows:

1. Create a release branch from `develop` (e.g., `release/v1.0.0`)
2. Create a pull request to merge the release branch into `main`
3. Once approved, merge the pull request
4. Tag the release in GitHub (e.g., `v1.0.0`)
5. The production deployment workflow will automatically deploy the tagged release

### Rollback Procedure

If issues are discovered after deployment, follow these steps to roll back:

1. Identify the last stable version tag
2. Manually trigger the production deployment workflow
3. Select the stable version tag
4. Monitor the application to ensure the rollback was successful

## Environment Configuration

### Development Environment

- **Server**: AWS EC2 t3.medium instance
- **Domain**: dev-analytics.example.com
- **Database**: MongoDB Atlas (Development Cluster)
- **Caching**: Redis (Development Instance)

### Production Environment

- **Server**: AWS EC2 m5.large instances behind a load balancer
- **Domain**: analytics.example.com
- **Database**: MongoDB Atlas (Production Cluster)
- **Caching**: ElastiCache Redis Cluster

## Monitoring and Logging

Both environments are monitored using:

- **Application Logs**: Stored in CloudWatch Logs
- **Performance Metrics**: Collected by New Relic
- **Error Tracking**: Sentry for real-time error monitoring
- **Uptime Monitoring**: Pingdom for external availability checks

## Troubleshooting

### Common Issues

#### Backend Service Won't Start

Check the logs for errors:

```bash
pm2 logs klaviyo-api
```

Verify environment variables are correctly set:

```bash
cat .env
```

#### Frontend Service Won't Start

Check the logs for errors:

```bash
pm2 logs klaviyo-frontend
```

Verify the API URL is correctly set:

```bash
grep -r "NEXT_PUBLIC_API_URL" .
```

#### API Returning 500 Errors

Check the Klaviyo API key:

```bash
curl -I https://a.klaviyo.com/api/v1/metrics \
  -H "Authorization: Klaviyo-API-Key YOUR_API_KEY"
```

Verify the cache is functioning:

```bash
redis-cli ping
```

## Deployment Checklist

Use this checklist before each production deployment:

- [ ] All tests pass in the CI pipeline
- [ ] Code has been reviewed and approved
- [ ] Documentation has been updated
- [ ] Release notes have been prepared
- [ ] Database migrations (if any) have been tested
- [ ] Backup of the current production environment has been created
- [ ] Monitoring alerts have been configured
- [ ] Rollback procedure has been reviewed
