# CI/CD & Deployment

## GitHub Actions

Create a workflow file (e.g., `.github/workflows/ci.yml`):

```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd backend && npm install
      - run: cd backend && npm run lint
      - run: cd backend && npm run test
```

This ensures each PR must pass tests and linting before merge.

## Deployment

### Environment Setup

1. **Platform Selection**
   - If using Next.js, consider Vercel
   - For Node/Express, consider Heroku or similar platforms
   - Configure environment variables (`KLAVIYO_API_KEY`) securely
   - **Never** expose your Klaviyo key to the front-end

2. **Security Considerations**
   - Use HTTPS for all endpoints
   - Implement proper CORS policies
   - Set up rate limiting
   - Configure secure headers

3. **Monitoring & Logging**
   - Set up error tracking (e.g., Sentry)
   - Configure application logging
   - Monitor API performance
   - Set up alerts for critical issues

### Deployment Process

1. **Pre-deployment**
   - Run all tests
   - Check linting
   - Build production assets
   - Verify environment variables

2. **Deployment Strategy**
   - Use zero-downtime deployments
   - Consider blue-green deployment
   - Have rollback plan ready
   - Monitor deployment health

3. **Post-deployment**
   - Verify application health
   - Check error rates
   - Monitor performance metrics
   - Test critical functionality

## Final Checklist

By following this specification, ensure you have:

1. Written **unit & integration tests** for each route (`/api/overview`, `/api/campaigns`, `/api/flows`, `/api/forms`, `/api/segments`)
2. Implemented each route's logic in small increments, verifying the tests pass
3. Used **GitHub** with feature branches, pull requests, and a CI workflow
4. Relied on the **latest Klaviyo endpoints** to retrieve marketing data
5. Added caching or scheduled sync to optimize performance
6. Set up proper monitoring and error tracking
7. Documented all endpoints and their usage
8. Implemented proper security measures
9. Set up automated deployment pipeline
10. Created rollback procedures
