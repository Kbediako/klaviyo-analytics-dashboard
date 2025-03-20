# Technology Stack

## Backend
- **Language**: Node.js (>= 16) with TypeScript
- **Framework**: Express or Next.js API routes
- **Testing**: Jest (or Vitest) for unit tests, Supertest for integration testing
- **Environment Variables**: Dotenv or Next.js environment variables

## Frontend
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Performance Considerations

### Caching Strategy
- Consider caching Klaviyo API responses
- Implement Redis or in-memory cache for high-traffic scenarios
- Use scheduled sync for frequently accessed data

### Rate Limiting
- Be aware of Klaviyo API rate limits
- Implement retry mechanisms
- Consider batching requests where appropriate
