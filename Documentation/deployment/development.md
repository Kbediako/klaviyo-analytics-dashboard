# Development Deployment Guide

## Prerequisites

Before deploying to the development environment, ensure:

1. All tests pass locally
2. The code has been reviewed by at least one team member
3. The necessary environment variables are configured in GitHub Secrets

## GitHub Secrets Required

Configure these secrets in the GitHub repository settings:

- `KLAVIYO_API_KEY_DEV`: Klaviyo API key for the development environment
- `NEXT_PUBLIC_API_URL_DEV`: URL of the backend API in the development environment
- `SSH_PRIVATE_KEY`: SSH private key for accessing the development server
- `DEV_SERVER_HOST`: Hostname of the development server
- `DEV_SERVER_USER`: Username for SSH access to the development server
- `DEV_SERVER_PATH`: Path on the server where the application should be deployed
- `SLACK_WEBHOOK_URL`: Webhook URL for Slack notifications

## Deployment Process

The development deployment process consists of:

1. **Test**: Run all backend tests to ensure everything is working correctly
2. **Build**: Build both the backend and frontend applications
3. **Deploy**: Copy the built artifacts to the development server and restart the services
4. **Notify**: Send a notification to Slack about the deployment status

## Manual Deployment

To manually trigger a deployment:

1. Go to the GitHub repository
2. Navigate to the "Actions" tab
3. Select the "Development Deployment" workflow
4. Click "Run workflow"
5. Select the target environment (development or staging)
6. Click "Run workflow" again

## Feature Flags

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

## Environment Configuration

### Development Environment

- **Server**: AWS EC2 t3.medium instance
- **Domain**: dev-analytics.example.com
- **Database**: MongoDB Atlas (Development Cluster)
- **Caching**: Redis (Development Instance)

## Monitoring

Development environment is monitored using:

- **Application Logs**: Stored in CloudWatch Logs
- **Performance Metrics**: Collected by New Relic
- **Error Tracking**: Sentry for real-time error monitoring
- **Uptime Monitoring**: Pingdom for external availability checks
