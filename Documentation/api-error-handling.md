# API Error Handling & Rate Limiting

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `500 Internal Server Error`: Server-side error

Error responses include a JSON object with error details:

```json
{
  "error": "Error message",
  "message": "Detailed error message"
}
```

### Common Error Scenarios

1. Invalid date range format:
```json
{
  "error": "Invalid date range",
  "message": "Date range must be in format YYYY-MM-DD_to_YYYY-MM-DD or a predefined range"
}
```

2. Missing required parameters:
```json
{
  "error": "Missing parameter",
  "message": "Required parameter 'id' is missing"
}
```

3. Server errors:
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch data from Klaviyo API"
}
```

## Rate Limiting

The API currently does not implement rate limiting, but it's recommended to avoid making too many requests in a short period to prevent hitting Klaviyo API rate limits.

### Best Practices

1. Implement client-side caching where appropriate
2. Batch requests when possible
3. Use appropriate polling intervals
4. Consider implementing exponential backoff for retries
