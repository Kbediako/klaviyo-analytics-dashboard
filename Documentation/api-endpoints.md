# Klaviyo Analytics Dashboard API Endpoints

## Overview Endpoint

```
GET /api/overview
```

Returns high-level marketing metrics for the specified date range.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Date range for metrics (default: `last-30-days`) |

### Response

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

### Response Fields

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

## Campaigns Endpoint

```
GET /api/campaigns
```

Returns campaign performance data for the specified date range.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Date range for metrics (default: `last-30-days`) |

### Response

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
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the campaign |
| name | string | Name of the campaign |
| sent | number | Number of emails sent |
| openRate | number | Percentage of emails opened |
| clickRate | number | Percentage of emails clicked |
| conversionRate | number | Percentage of conversions from the campaign |
| revenue | number | Revenue generated from the campaign |

## Flows Endpoint

```
GET /api/flows
```

Returns flow performance metrics for the specified date range.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Date range for metrics (default: `last-30-days`) |

### Response

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
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the flow |
| name | string | Name of the flow |
| recipients | number | Number of recipients in the flow |
| openRate | number | Percentage of emails opened |
| clickRate | number | Percentage of emails clicked |
| conversionRate | number | Percentage of conversions from the flow |
| revenue | number | Revenue generated from the flow |

## Forms Endpoint

```
GET /api/forms
```

Returns form submission and conversion data for the specified date range.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Date range for metrics (default: `last-30-days`) |

### Response

```json
[
  {
    "id": "1",
    "name": "Newsletter Signup",
    "views": 12480,
    "submissions": 4742,
    "submissionRate": 38,
    "conversions": 1850
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the form |
| name | string | Name of the form |
| views | number | Number of form views |
| submissions | number | Number of form submissions |
| submissionRate | number | Percentage of views that resulted in submissions |
| conversions | number | Number of conversions from form submissions |

## Segments Endpoint

```
GET /api/segments
```

Returns segment membership and performance data for the specified date range.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| dateRange | string | No | Date range for metrics (default: `last-30-days`) |

### Response

```json
[
  {
    "id": "1",
    "name": "VIP Customers",
    "count": 5842,
    "conversionRate": 42,
    "revenue": 28450
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the segment |
| name | string | Name of the segment |
| count | number | Number of profiles in the segment |
| conversionRate | number | Conversion rate for the segment as a percentage |
| revenue | number | Revenue generated from the segment |
