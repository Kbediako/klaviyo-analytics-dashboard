# Setting Up the Klaviyo Analytics Dashboard for Live API Testing

This guide explains how to set up the Klaviyo Analytics Dashboard to work with a live Klaviyo API key.

## Prerequisites

- A Klaviyo account with API access
- A Klaviyo Private API key

## Setup Steps

1. **Create a .env file in the backend directory**

   Create a file named `.env` in the `backend` directory with the following content:

   ```
   # API Configuration
   PORT=3001
   NODE_ENV=development
   KLAVIYO_API_KEY=your_api_key_here

   # Redis Configuration
   REDIS_URL=redis://localhost:6379

   # Logging
   LOG_LEVEL=info

   # Cache Configuration
   CACHE_TTL=900 # 15 minutes in seconds

   # API Rate Limiting
   RATE_LIMIT_WINDOW=900000 # 15 minutes in milliseconds
   RATE_LIMIT_MAX_REQUESTS=100

   # Sync Configuration
   SYNC_INTERVAL=3600000 # 1 hour in milliseconds
   SYNC_BATCH_SIZE=100

   # Monitoring Configuration
   METRICS_INTERVAL=60000 # 1 minute in milliseconds
   HEALTH_CHECK_INTERVAL=300000 # 5 minutes in milliseconds
   ```

   Replace `your_api_key_here` with your actual Klaviyo Private API key.

2. **Start the application with the live API**

   Run the following command from the project root:

   ```bash
   ./run-with-live-api.sh
   ```

   This script will:
   - Start the backend server with your Klaviyo API key
   - Start the frontend connected to the backend
   - Both servers can be stopped with Ctrl+C

3. **Verify the connection**

   Once the servers are running, you can verify the connection by:
   
   - Visiting http://localhost:3001/api/health in your browser to check the backend health
   - Visiting http://localhost:3000 to access the dashboard
   - Checking the backend logs for successful API requests to Klaviyo

## Monitoring and Diagnostics

With the monitoring and diagnostics system in place, you can access the following endpoints to monitor the application's performance:

- **Health Check**: http://localhost:3001/api/monitoring/health
- **System Metrics**: http://localhost:3001/api/monitoring/metrics
- **API Metrics**: http://localhost:3001/api/monitoring/api-metrics
- **Error Tracking**: http://localhost:3001/api/monitoring/errors
- **System Status**: http://localhost:3001/api/monitoring/status

These endpoints provide valuable information about the application's performance, including:

- Database connection status
- Redis/cache system health
- Memory and CPU usage
- API response times
- Error rates and details

## Troubleshooting

### API Key Issues

If you see authentication errors in the logs, check that:

- Your API key is correctly entered in the `.env` file
- Your API key has the necessary permissions in Klaviyo
- The API key format is valid (alphanumeric characters, no spaces)

### Rate Limiting

The Klaviyo API has rate limits. If you encounter rate limiting issues:

- The application will automatically handle rate limiting with exponential backoff
- You can adjust the `RATE_LIMIT_WINDOW` and `RATE_LIMIT_MAX_REQUESTS` in the `.env` file
- Check the logs for rate limiting errors and adjust your request patterns if needed

### Connection Issues

If the application cannot connect to the Klaviyo API:

- Check your internet connection
- Verify that the Klaviyo API is operational
- Check the logs for network errors or timeouts
- Ensure your firewall or network settings allow outbound connections to Klaviyo's API endpoints

## Security Considerations

- Never commit your `.env` file to version control
- Keep your API key secure and rotate it regularly
- Use environment variables for all sensitive information
- Consider using a more restrictive API key for testing purposes
