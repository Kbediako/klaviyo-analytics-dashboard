# Test Scenarios (Test-First Specs)

Below are sample test scenarios you should write before coding. Use Jest + Supertest if implementing Express routes.

## GET /api/overview

### Scenario: "Fetches high-level metrics for last-30-days"

1. **Given** the environment has a valid `KLAVIYO_API_KEY`,
2. **When** I send `GET /api/overview?dateRange=last-30-days`,
3. **Then** I expect a `200` response with JSON containing:
```json
{
  "totalRevenue": "expect.any(Number)",
  "activeSubscribers": "expect.any(Number)",
  "conversionRate": "expect.any(Number)",
  "formSubmissions": "expect.any(Number)",
  "periodComparison": {
    "totalRevenue": "expect.stringMatching(/^[-+]\\d+(\\.\\d+)?%$/)",
    ...
  }
}
```

### Scenario: "Handles invalid or missing dateRange gracefully"
- If no `dateRange` is provided, default to "last-30-days"
- Return a `200` with valid metrics

## GET /api/campaigns

### Scenario: "Lists campaigns with performance data for a given date range"

1. **Given** I have some campaigns in Klaviyo,
2. **When** I call `GET /api/campaigns?dateRange=2023-01-01_to_2023-02-01`,
3. **Then** response includes an array of objects like:
```json
[
  {
    "id": "campaign_abc",
    "name": "Summer Sale",
    "sent": "expect.any(Number)",
    "openRate": "expect.any(Number)",
    "clickRate": "expect.any(Number)",
    "conversionRate": "expect.any(Number)",
    "revenue": "expect.any(Number)"
  }
]
```
4. **And** ensures date filtering is correct (no campaigns outside the date range)

## GET /api/flows

### Scenario: "Returns flows with aggregated metrics"
- Should retrieve flow info from `GET /api/flows/` or `GET /api/flow-messages/` and combine with events to get open/click rates
- Test expects fields: `id, name, recipients, openRate, clickRate, conversionRate, revenue`

## GET /api/forms

### Scenario: "Lists form stats (views, submissions) from last 30 days"
- If you track forms via **Klaviyo Onsite** or a custom approach, test that the route merges that data properly
- Expects shape: `[ { "id": "form_1", "name": "...", "views": 1234, "submissions": 200, ... } ]`

## GET /api/segments

### Scenario: "Lists top segments with counts, conversion rates, revenue"
- Should handle segments that do not have associated revenue or conversion data gracefully
- Return a consistent shape: `[ { "id": "...", "name": "VIP Customers", "conversionRate": 42, "count": 5842, "revenue": 28450 }, ...]`

## Error Handling & Auth

### Scenario: "Returns 401 if Klaviyo API key is invalid"
- Mock the Klaviyo API to return an unauthorized error
- Expect the backend to handle gracefully and respond with `500` or `401` (depending on your approach) and an error message
