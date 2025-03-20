# API Guidelines

## Endpoint Structure
- All endpoints should follow consistent patterns
- Use clear and descriptive names
- Support query parameters for filtering (especially `dateRange`)

## Standard Endpoints
1. `GET /api/overview`: High-level marketing metrics
2. `GET /api/campaigns`: Campaign performance data
3. `GET /api/flows`: Flow performance metrics
4. `GET /api/forms`: Form submission and conversion metrics
5. `GET /api/segments`: Segment membership and performance

## Response Format
- Use consistent JSON structures
- Include error handling in the response
- Follow appropriate naming conventions (camelCase)

## Date Range Handling
- Support flexible date range formats (e.g., `last-30-days`, `last-7-days`, custom ranges)
- Implement utility functions to parse date ranges consistently
- Handle timezone considerations

## Error Handling
- Use appropriate HTTP status codes
- Provide detailed error messages
- Include error codes for client-side handling
- Log errors for debugging

## Rate Limiting
- Implement rate limiting for all endpoints
- Return 429 status code when limit exceeded
- Include rate limit headers in responses
- Document rate limits in API documentation
