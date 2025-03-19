# Klaviyo Analytics Dashboard API Documentation

This document provides detailed information about the API endpoints available in the Klaviyo Analytics Dashboard backend.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3001/api
```

## Authentication

Currently, the API does not require authentication as it's designed to be used internally. The backend securely stores and uses the Klaviyo API key for all requests to the Klaviyo API.

## Date Range Format

Many endpoints accept a `dateRange` query parameter that can be in the following formats:

- Predefined ranges: `last-7-days`, `last-30-days`, `last-90-days`
- Custom range: `2023-01-01_to_2023-02-01` (ISO date format with underscore separator)

If no date range is provided, the default is `last-30-days`.

## Endpoints

### Overview

```
GET /api/overview
```

Returns high-level marketing metrics for the specified date range.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Date range for metrics (default: `last-30-days`) |

#### Response

```json
{
  "totalRevenue": 42582,
  "activeSubscribers": 24853,
  "conversionRate": 18.5,
  "formSubmissions": 3842,
  "periodComparison": {
    "totalRevenue": "+10.0%",
    "activeSubscribers": "+5.2%",
    "conversionRate": "-2.1%",
    "formSubmissions": "+15.3%"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| totalRevenue | number | Total revenue generated in the specified period |
| activeSubscribers | number | Number of active subscribers |
| conversionRate | number | Conversion rate as a percentage |
| formSubmissions | number | Number of form submissions |
| periodComparison | object | Comparison with previous period |
| periodComparison.totalRevenue | string | Percentage change in total revenue |
| periodComparison.activeSubscribers | string | Percentage change in active subscribers |
| periodComparison.conversionRate | string | Percentage change in conversion rate |
| periodComparison.formSubmissions | string | Percentage change in form submissions |

### Campaigns

```
GET /api/campaigns
```

Returns campaign performance data for the specified date range.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Date range for metrics (default: `last-30-days`) |

#### Response

```json
[
  {
    "id": "1",
    "name": "Summer Sale Announcement",
    "sent": 24850,
    "openRate": 42.8,
    "clickRate": 18.5,
    "conversionRate": 8.2,
    "revenue": 12580
  },
  {
    "id": "2",
    "name": "New Product Launch",
    "sent": 18650,
    "openRate": 38.5,
    "clickRate": 15.2,
    "conversionRate": 6.8,
    "revenue": 9840
  }
]
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the campaign |
| name | string | Name of the campaign |
| sent | number | Number of emails sent |
| openRate | number | Percentage of emails opened |
| clickRate | number | Percentage of emails clicked |
| conversionRate | number | Percentage of conversions from the campaign |
| revenue | number | Revenue generated from the campaign |

### Flows

```
GET /api/flows
```

Returns flow performance metrics for the specified date range.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Date range for metrics (default: `last-30-days`) |

#### Response

```json
[
  {
    "id": "1",
    "name": "Welcome Series",
    "recipients": 8450,
    "openRate": 68.5,
    "clickRate": 42.8,
    "conversionRate": 32,
    "revenue": 24850
  },
  {
    "id": "2",
    "name": "Abandoned Cart",
    "recipients": 6280,
    "openRate": 58.2,
    "clickRate": 38.5,
    "conversionRate": 28,
    "revenue": 18650
  }
]
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the flow |
| name | string | Name of the flow |
| recipients | number | Number of recipients in the flow |
| openRate | number | Percentage of emails opened |
| clickRate | number | Percentage of emails clicked |
| conversionRate | number | Percentage of conversions from the flow |
| revenue | number | Revenue generated from the flow |

### Forms

```
GET /api/forms
```

Returns form submission and conversion data for the specified date range.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Date range for metrics (default: `last-30-days`) |

#### Response

```json
[
  {
    "id": "1",
    "name": "Newsletter Signup",
    "views": 12480,
    "submissions": 4742,
    "submissionRate": 38,
    "conversions": 1850
  },
  {
    "id": "2",
    "name": "Contact Form",
    "views": 8650,
    "submissions": 2850,
    "submissionRate": 33,
    "conversions": 950
  }
]
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the form |
| name | string | Name of the form |
| views | number | Number of form views |
| submissions | number | Number of form submissions |
| submissionRate | number | Percentage of views that resulted in submissions |
| conversions | number | Number of conversions from form submissions |

### Segments (Coming Soon)

```
GET /api/segments
```

Will return segment membership and performance data for the specified date range.

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

## Rate Limiting

The API currently does not implement rate limiting, but it's recommended to avoid making too many requests in a short period to prevent hitting Klaviyo API rate limits.
