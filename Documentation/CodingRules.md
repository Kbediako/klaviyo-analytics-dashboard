# Klaviyo Analytics Dashboard - Coding Rules

## Project Structure

### Repository Layout
```
analytics-app/
├── frontend/
│   └── (Next.js or React code)
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
└── .github/
    └── workflows/
```

## Development Approach

### Test-First Development (TDD)
1. Create a feature branch from `main` (e.g., `feature/backend-campaigns-endpoint`)
2. Write failing tests first
3. Write minimal code to pass the tests
4. Open a Pull Request to `main`
5. CI pipeline runs tests, linting, type checks
6. After all checks pass and code review, merge into `main`

## Technology Stack

### Backend
- **Language**: Node.js (>= 16) with TypeScript
- **Framework**: Express or Next.js API routes
- **Testing**: Jest (or Vitest) for unit tests, Supertest for integration testing
- **Environment Variables**: Dotenv or Next.js environment variables

### Frontend
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Code Style & Best Practices

### General
- Keep components small and focused
- Use custom hooks for shared logic
- Separate data fetching from presentation
- Use TypeScript for type safety
- Follow consistent naming conventions

### Backend
1. Keep controllers minimal - they should only:
   - Parse request parameters
   - Call services
   - Return responses
   - Handle errors

2. Business logic should be in services:
   - API calls to Klaviyo
   - Data transformation
   - Aggregation and calculations

3. Each endpoint should have corresponding tests:
   - Unit tests for services
   - Integration tests for controllers/routes

4. Error handling:
   - Gracefully handle API failures
   - Return appropriate HTTP status codes
   - Provide meaningful error messages

### Frontend
1. Component organization:
   - Create reusable components
   - Maintain clear component hierarchy
   - Use consistent prop interfaces

2. Performance considerations:
   - Use memoization for expensive calculations
   - Implement virtualization for long lists
   - Lazy load components when appropriate

3. Responsive design:
   - Design for mobile-first
   - Use Tailwind responsive classes
   - Ensure UI is usable on all device sizes

4. Accessibility:
   - Maintain proper contrast ratios
   - Use semantic HTML elements
   - Include ARIA attributes where needed
   - Support keyboard navigation

## API Design

### Endpoint Structure
- All endpoints should follow consistent patterns
- Use clear and descriptive names
- Support query parameters for filtering (especially `dateRange`)

### Standard Endpoints
1. `GET /api/overview`: High-level marketing metrics
2. `GET /api/campaigns`: Campaign performance data
3. `GET /api/flows`: Flow performance metrics
4. `GET /api/forms`: Form submission and conversion metrics
5. `GET /api/segments`: Segment membership and performance

### Response Format
- Use consistent JSON structures
- Include error handling in the response
- Follow appropriate naming conventions (camelCase)

### Date Range Handling
- Support flexible date range formats (e.g., `last-30-days`, `last-7-days`, custom ranges)
- Implement utility functions to parse date ranges consistently
- Handle timezone considerations

## Security Practices

1. API key security:
   - Store Klaviyo API key in environment variables
   - Never expose API keys to the frontend
   - Use proper authorization headers with Klaviyo API

2. Secure coding:
   - Validate and sanitize inputs
   - Protect against common web vulnerabilities
   - Follow OWASP best practices

## CI/CD & Deployment

1. GitHub Actions workflow:
   - Run on push and pull requests
   - Check linting
   - Run tests
   - Type checking

2. Deployment considerations:
   - Configure environment variables securely
   - Consider rate limiting strategies
   - Implement caching when appropriate

## Documentation Standards

1. Code comments:
   - Document complex logic
   - Explain non-obvious functionality
   - Use JSDoc for functions and interfaces

2. API documentation:
   - Document all endpoints
   - Specify request and response formats
   - Provide example usage

3. README updates:
   - Keep documentation current with code changes
   - Include setup and development instructions
   - Document any required environment variables

## Performance Considerations

1. Caching strategy:
   - Consider caching Klaviyo API responses
   - Implement Redis or in-memory cache for high-traffic scenarios
   - Use scheduled sync for frequently accessed data

2. Rate limiting:
   - Be aware of Klaviyo API rate limits
   - Implement retry mechanisms
   - Consider batching requests where appropriate

## Version Control

1. Commit messages:
   - Use clear, descriptive commit messages
   - Reference issue numbers when applicable
   - Follow conventional commits pattern (optional)

2. Branch strategy:
   - `main` for production code
   - Feature branches for development
   - Consider release branches for major versions 