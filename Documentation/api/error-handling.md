# Error Handling

This document details error handling for the analytics API.

## Error Codes

All endpoints follow standard HTTP error code conventions:

- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Metric not found
- `500 Internal Server Error` - Server-side processing error

## Error Responses

Error responses include detailed error messages:

```json
{
  "error": "Failed to calculate correlation",
  "message": "Time series have different lengths. Set alignTimestamps=true to handle unequal series lengths."
}
```