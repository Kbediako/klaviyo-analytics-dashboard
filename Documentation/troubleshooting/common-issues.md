# Common Issues & Troubleshooting

## Environment Issues

### "Missing required environment variable"
- Check your `.env` file
- Verify all required variables are set
- Check for typos in variable names

### Klaviyo API Errors
- Verify API key is valid
- Check rate limits
- Ensure proper authorization headers

### Performance Issues

#### Slow Responses
- Check cache configuration
- Verify Klaviyo API status
- Monitor response times
- Check for bottlenecks

#### 429 Rate Limit Errors
The backend implements rate limiting to avoid overloading the Klaviyo API. If you're seeing 429 errors:
- Check the rate limiting configuration in `backend/src/middleware/rateLimitMiddleware.ts`
- Adjust limits based on usage patterns
- Implement retry mechanisms
- Consider caching frequently accessed data

## Code Issues

### Syntax Errors in API Code
If you encounter unexpected syntax errors:
- Check for missing commas in function parameters
- Verify object definitions
- Pay special attention to rate limiting middleware
- Review API query hooks

### Chart Data Not Updating
If chart data isn't updating with date range changes:
- Verify correct endpoint paths (e.g., '/charts/revenue' instead of '/revenue')
- Check if MSW is enabled and potentially intercepting requests
- Ensure date range parameters are being passed correctly
- Verify cache invalidation on date range changes
