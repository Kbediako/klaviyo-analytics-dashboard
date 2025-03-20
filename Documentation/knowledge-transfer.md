# Knowledge Transfer Documentation

## Project Overview

The Klaviyo Analytics Dashboard is a Next.js application that provides analytics and visualization for Klaviyo marketing data. The project is being enhanced with advanced analytics capabilities and data persistence.

## Implementation Plan

For detailed implementation steps, see [Implementation Phases](./implementation/phases/README.md). The enhancement project is divided into six phases over 12 weeks:

1. [API Client Modernization](./implementation/phases/01-api-client-modernization.md) (Weeks 1-2)
2. [Database Implementation](./implementation/phases/02-database-implementation.md) (Weeks 3-4)
3. [Service Layer Enhancement](./implementation/phases/03-service-layer-enhancement.md) (Weeks 5-6)
4. [Analytics Engine Development](./implementation/phases/04-analytics-engine.md) (Weeks 7-8)
5. [Frontend Integration](./implementation/phases/05-frontend-integration.md) (Weeks 9-10)
6. [Testing and Deployment](./implementation/phases/06-testing-and-deployment.md) (Weeks 11-12)

## Architecture

### Current Architecture
- Frontend: Next.js with React
- UI Components: shadcn/ui and Recharts
- API Client: Custom implementation with caching
- Data Source: Direct Klaviyo API integration

### Enhanced Architecture
See [Architecture Documentation](./architecture/README.md) for detailed information about:
- Data persistence with PostgreSQL/TimescaleDB
- Advanced analytics pipeline
- Machine learning capabilities
- Enhanced API integration

## Key Components

### Frontend Components
- `analytics-dashboard.tsx`: Main dashboard component
- `revenue-chart.tsx`: Revenue visualization
- `channel-distribution-chart.tsx`: Channel metrics
- Various table components for campaigns, flows, and forms

### Backend Services
- `klaviyoApiClient.ts`: Handles Klaviyo API communication
- Service layer for each data type (campaigns, flows, forms)
- Data transformation and caching logic

### React Hooks
- `use-overview-metrics.ts`: Dashboard metrics
- `use-campaigns.ts`: Campaign data
- `use-flows.ts`: Flow metrics
- `use-forms.ts`: Form analytics
- `use-chart-data.ts`: Chart data processing

## Development Workflow

1. **Feature Development**
   - Create feature branch from `main`
   - Write tests first (TDD approach)
   - Implement feature
   - Open PR with tests and documentation

2. **Testing**
   - Unit tests with Jest
   - Integration tests with Supertest
   - E2E tests for critical paths
   - Mock server for development

3. **Deployment**
   - CI/CD with GitHub Actions
   - Staging environment testing
   - Production deployment checks

## Environment Setup

### Required Environment Variables
```bash
# Klaviyo API Configuration
KLAVIYO_API_KEY=your_api_key
KLAVIYO_API_VERSION=2023-07-15

# Backend Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (Enhanced Architecture)
POSTGRES_URL=postgresql://user:pass@localhost:5432/klaviyo_analytics
REDIS_URL=redis://localhost:6379
```

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Run with mock data:
   ```bash
   ./run-with-mock-server.sh
   ```

## API Integration

### Klaviyo API
- Base URL: https://a.klaviyo.com/api/
- Rate limiting: 1 request/second
- Retry mechanism with exponential backoff
- Error handling with fallbacks

### Endpoint Structure
- `/api/overview`: Dashboard metrics
- `/api/campaigns`: Campaign performance
- `/api/flows`: Flow analytics
- `/api/forms`: Form metrics
- `/api/segments`: Segment analysis

## Common Tasks

### Adding New Metrics
1. Add metric definition to `klaviyoApiClient.ts`
2. Create/update service methods
3. Add frontend components
4. Update tests

### Implementing New Features
1. Review architecture documentation
2. Follow implementation phases
3. Maintain backward compatibility
4. Add appropriate tests

### Troubleshooting
- Check API response logs
- Verify rate limiting
- Validate data transformations
- Review error handling

## Best Practices

### Code Style
- Use TypeScript for type safety
- Follow existing patterns
- Document complex logic
- Keep components focused

### Performance
- Implement appropriate caching
- Optimize database queries
- Monitor API usage
- Use proper indexing

### Testing
- Write comprehensive tests
- Use appropriate mocks
- Test edge cases
- Verify error handling

## Future Enhancements

See [Architecture Documentation](./architecture/README.md) for detailed implementation plans for:
1. Data persistence layer
2. Analytics foundation
3. Forecasting capabilities
4. Advanced analytics

## Support and Resources

### Documentation
- [Project Documentation](./README.md)
- [API Guidelines](./api-guidelines.md)
- [Architecture Documentation](./architecture/README.md)
- [Implementation Phases](./implementation/phases/README.md)
- [Klaviyo API Docs](https://developers.klaviyo.com)

### Team Contacts
- Frontend Lead: [Name]
- Backend Lead: [Name]
- DevOps Lead: [Name]
- Product Owner: [Name]

### Tools and Links
- GitHub Repository
- JIRA Board
- Team Wiki
- Monitoring Dashboard

## Getting Started with Implementation

1. Review the [Implementation Phases Overview](./implementation/phases/README.md)
2. Start with [Phase 1: API Client Modernization](./implementation/phases/01-api-client-modernization.md)
3. Follow each phase's success criteria before moving to the next
4. Use the provided code examples and configurations
5. Run tests at each step
6. Document any deviations or improvements

## Risk Management

See [Implementation Phases README](./implementation/phases/README.md#risk-management) for detailed risk management strategies including:
- API Rate Limiting mitigation
- Data Volume handling
- Performance optimization
- Integration complexity management
