# GitHub Repository Setup for CI/CD Pipeline

This document provides instructions for setting up the GitHub repository and configuring the necessary secrets and environment variables for the CI/CD pipeline.

## Repository Configuration

1. Create the following GitHub Environments:
   - `staging`
   - `production`

2. Configure environment protection rules:
   - For `production`: Enable "Required reviewers" and add appropriate team members
   - For both environments: Add appropriate deployment branches (main for production, main and develop for staging)

3. Configure branch protection rules for `main` and `develop`:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Include administrators in these restrictions

## Required Secrets

### Repository Secrets (Available to all environments)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKERHUB_USERNAME` | DockerHub username | `klaviyo-cicd` |
| `DOCKERHUB_TOKEN` | DockerHub access token | `dckr_pat_abcdefghijklmnopqrstuvwxyz` |
| `SLACK_WEBHOOK_URL` | Slack webhook URL for notifications | `https://hooks.slack.com/services/XXX/YYY/ZZZ` |

### Staging Environment Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_HOST` | Staging server hostname | `staging.example.com` |
| `STAGING_USERNAME` | SSH username for staging server | `deployer` |
| `STAGING_SSH_KEY` | SSH private key for staging server | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DB_HOST` | Database hostname | `db.staging.example.com` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database username | `klaviyo_staging` |
| `DB_PASSWORD` | Database password | `secure-password-here` |
| `DB_NAME` | Database name | `klaviyo_staging` |
| `KLAVIYO_API_KEY` | Klaviyo API key for staging | `pk_XXXXXXXXXXXXXXXXXXXXXXX` |
| `JWT_SECRET` | Secret for JWT token generation | `random-secure-string` |

### Production Environment Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `PRODUCTION_HOST` | Production server hostname | `production.example.com` |
| `PRODUCTION_USERNAME` | SSH username for production server | `deployer` |
| `PRODUCTION_SSH_KEY` | SSH private key for production server | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DB_HOST` | Database hostname | `db.production.example.com` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database username | `klaviyo_production` |
| `DB_PASSWORD` | Database password | `secure-password-here` |
| `DB_NAME` | Database name | `klaviyo_production` |
| `KLAVIYO_API_KEY` | Klaviyo API key for production | `pk_XXXXXXXXXXXXXXXXXXXXXXX` |
| `JWT_SECRET` | Secret for JWT token generation | `random-secure-string` |

## Environment Variables

### Repository Variables (Available to all environments)

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `PRODUCTION_APPROVERS` | GitHub usernames who can approve production deployments | `username1,username2,username3` |

## Setting Up Secrets and Variables

### Adding Repository Secrets

1. Go to your GitHub repository
2. Click on Settings > Secrets and variables > Actions
3. Click on "New repository secret"
4. Enter the secret name and value
5. Click "Add secret"
6. Repeat for all repository-level secrets

### Adding Environment Secrets

1. Go to your GitHub repository
2. Click on Settings > Environments
3. Click on the environment name (e.g., "staging")
4. Click on "Add secret"
5. Enter the secret name and value
6. Click "Add secret"
7. Repeat for all environment-specific secrets

### Adding Repository Variables

1. Go to your GitHub repository
2. Click on Settings > Secrets and variables > Actions
3. Click on the "Variables" tab
4. Click on "New repository variable"
5. Enter the variable name and value
6. Click "Add variable"
7. Repeat for all repository-level variables

## Testing the CI/CD Pipeline

After setting up all secrets and variables, you can test the CI/CD pipeline by:

1. Creating a new branch
2. Making a change to the codebase
3. Pushing the branch to GitHub
4. Creating a pull request to merge into `develop`
5. Verifying that the CI pipeline runs successfully
6. Merging the pull request
7. Verifying that the staging deployment completes successfully

## Troubleshooting

If you encounter issues with the CI/CD pipeline, check the following:

1. **SSH Connection Issues**: Ensure the SSH key is correctly formatted and has the necessary permissions.
2. **Docker Push Failures**: Verify that the DockerHub credentials are correct and have permissions to push to the repository.
3. **Deployment Script Errors**: Check the logs for the deployment job to see detailed error messages.
4. **Secret Access Issues**: Ensure that secrets are defined in the correct environments and with the correct names.

For detailed logs and troubleshooting, check the GitHub Actions workflow runs in the "Actions" tab of your repository.