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
- `enhanced-revenue-chart.tsx`: Advanced revenue visualization with forecasting
- `channel-distribution-chart.tsx`: Channel metrics
- Various table components for campaigns, flows, and forms

### Backend Services
- `klaviyoApiClient.ts`: Handles Klaviyo API communication
- `dataSyncService.ts`: Manages data synchronization between Klaviyo API and local database
- `scheduler/index.ts`: Schedules regular data synchronization jobs
- Service layer for each data type (campaigns, flows, forms)
- Data transformation and caching logic
- `analytics/timeSeriesAnalyzer.ts`: Time series analysis and decomposition
- `analytics/forecastService.ts`: Forecasting models with confidence intervals

### Database Components
- `database/index.ts`: Database connection manager with connection pooling
- `repositories/metricRepository.ts`: Repository for Klaviyo metrics
- `repositories/eventRepository.ts`: Repository for Klaviyo events
- `repositories/profileRepository.ts`: Repository for Klaviyo profiles
- `repositories/campaignRepository.ts`: Repository for Klaviyo campaigns
- TimescaleDB for time-series data optimization
- Migration scripts for database schema management
- Aggregated metrics for faster time-series queries

### React Hooks
- `use-overview-metrics.ts`: Dashboard metrics
- `use-campaigns.ts`: Campaign data
- `use-flows.ts`: Flow metrics
- `use-forms.ts`: Form analytics
- `use-chart-data.ts`: Chart data processing
- `use-time-series.ts`: Time series data with decomposition and anomaly detection
- `use-forecast.ts`: Forecast data with confidence intervals and correlation analysis

## Development Workflow

1. **Feature Development**
   - Create feature branch from `main`
   - Write tests first (TDD approach)
   - Implement feature
   - Open PR with tests and documentation
   - Commit at key milestones and keep documentation up to date

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

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=klaviyo
DB_PASSWORD=klaviyo_pass
DB_NAME=klaviyo_analytics
REDIS_URL=redis://localhost:6379
```

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the database:
   ```bash
   ./start-db.sh
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Run with mock data:
   ```bash
   ./run-with-mock-server.sh
   ```

## Database Setup

### Docker Setup
The project uses Docker Compose to run PostgreSQL with TimescaleDB:

```bash
# Start the database
docker-compose up -d timescaledb

# Run migrations
node db/run-migrations.js
```

### Database Schema
The database schema includes:

1. **klaviyo_metrics**: Stores information about Klaviyo metrics
2. **klaviyo_profiles**: Stores information about Klaviyo customer profiles
3. **klaviyo_events**: Stores Klaviyo events with time-series optimization
4. **klaviyo_aggregated_metrics**: Stores pre-aggregated metrics for faster queries

### Repository Pattern
The project uses the repository pattern for database access:

```typescript
// Example: Finding events by metric ID
const events = await eventRepository.findByMetricId('metric-123');

// Example: Creating a new metric
const metric = await metricRepository.create({
  id: 'metric-456',
  name: 'New Metric',
  integration_category: 'email'
});
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
- `/api/analytics/timeseries/:metricId`: Time series data
- `/api/analytics/decomposition/:metricId`: Time series decomposition
- `/api/analytics/anomalies/:metricId`: Anomaly detection
- `/api/analytics/forecast/:metricId`: Forecasting with multiple methods
- `/api/analytics/correlation`: Correlation between metrics

## Common Tasks

### Adding New Metrics
1. Add metric definition to `klaviyoApiClient.ts`
2. Create/update service methods
3. Add frontend components
4. Update tests

### Working with Analytics
1. Use `timeSeriesAnalyzer.ts` for time-series analysis
2. Use `forecastService.ts` for generating forecasts
3. Access analytics through the `/api/analytics/*` endpoints
4. Customize analysis with query parameters (interval, window size, etc.)
5. Combine with existing metrics for comprehensive insights

### Working with Forecasting
1. Use the `use-forecast.ts` hook to fetch forecast data
2. Configure forecast parameters (method, horizon, etc.)
3. Visualize forecasts with confidence intervals using `enhanced-revenue-chart.tsx`
4. Compare different forecasting methods (naive, moving average, linear regression)
5. Analyze forecast accuracy and adjust parameters as needed

### Working with Time Series
1. Use the `use-time-series.ts` hook to fetch time series data
2. Analyze trends, seasonality, and residuals with decomposition
3. Detect anomalies in time series data
4. Visualize time series components in charts
5. Correlate different metrics to identify relationships

### Working with the Database
1. Use repository classes for database operations
2. Implement transaction handling for multi-step operations
3. Use time-series functions for time-based analytics
4. Implement proper error handling
5. Use the database-first approach in controllers (check database before API)
6. Trigger background sync for future requests

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
- Check database connection issues

## Best Practices

### Code Style
- Use TypeScript for type safety
- Follow existing patterns
- Document complex logic
- Keep components focused

### Database Performance
- Use TimescaleDB hypertables for time-series data
- Create appropriate indexes for common queries
- Use pre-aggregated metrics for analytics
- Implement connection pooling
- Use transactions for data integrity

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
2. Analytics foundation (implemented in Phase 4)
3. Forecasting capabilities (implemented in Phase 4)
4. Advanced analytics
5. Machine learning model integration
6. Real-time analytics dashboards

## Support and Resources

### Documentation
- [Project Documentation](./README.md)
- [API Guidelines](./api-guidelines.md)
- [Architecture Documentation](./architecture/README.md)
- [Implementation Phases](./implementation/phases/README.md)
- [Klaviyo API Docs](https://developers.klaviyo.com)
- [Database Documentation](../db/README.md)

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
7. Commit code at key milestones
8. Keep documentation up to date with implementation

### Running the Implementation

1. Start the database:
   ```bash
   ./start-db.sh
   ```

2. Run database migrations:
   ```bash
   ./run-migrations.sh
   ```

3. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

4. Start the frontend:
   ```bash
   npm run dev
   ```

5. Access the dashboard at http://localhost:3000

## Risk Management

See [Implementation Phases README](./implementation/phases/README.md#risk-management) for detailed risk management strategies including:
- API Rate Limiting mitigation
- Data Volume handling
- Performance optimization
- Integration complexity management
- Database scaling considerations
