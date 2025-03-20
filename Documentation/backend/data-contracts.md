# Data Contracts & Endpoints

## Primary Data Sets

Your UI requires these primary data sets:

- **Overview**: total revenue, active subscribers, conversion rate, form submissions
- **Campaigns**: ID, name, sent, open rate, click rate, conversion, revenue
- **Flows**: ID, name, recipients, open rate, click rate, conversion, revenue
- **Forms**: ID, name, views, submissions, submission rate, conversions
- **Segments**: ID, name, conversion rate, count, revenue

## Relevant Klaviyo Endpoints

References: [Klaviyo Developer Docs](https://developers.klaviyo.com/en/reference/), version `2023-07-15` or `2023-02-22`

1. **Campaigns**: `GET /api/campaigns/`
   - Returns campaign objects with basic stats
   - Additional details (sent_count, open_rate, etc.) may require the Campaign Messages or Metrics endpoints

2. **Flows**: `GET /api/flows/` and `GET /api/flow-messages/`
   - Lists flows and their messages
   - For performance metrics, combine with Events or Metrics

3. **Events**: `GET /api/events/`
   - Pull "Opened Email," "Clicked Email," "Placed Order," etc.
   - Combine to compute conversion, revenue, etc.

4. **Profiles**: `GET /api/profiles/`
   - For active subscribers (filter by subscription status)

5. **Segments**: `GET /api/segments/`
   - For dynamic segment membership counts, etc.

6. **Metrics**: `GET /api/metrics/`
   - Aggregated or time-series data (open rates, click rates) if needed

You can also rely on Klaviyo's aggregated endpoints if you prefer to avoid manual event counting.

## Data Transformation & Aggregation

- **Open Rate** = total opens / total sent
- **Click Rate** = total clicks / total sent
- **Conversion Rate** = total purchases / total sent (or total clicks, depending on your definition)
- **Revenue** = sum of "Placed Order" amounts attributed to the campaign/flow

Use Klaviyo's Events or Metrics endpoints to gather these details. Some endpoints might directly give you aggregated data.

## Date Range Handling

- Provide a utility to parse `last-30-days`, `last-7-days`, or custom date range strings into actual timestamps:

```typescript
export function parseDateRange(range: string): { start: string; end: string } {
  // e.g., last-30-days => { start: '2023-08-01T00:00:00Z', end: '2023-08-31T23:59:59Z' }
  // or "2023-01-01_to_2023-02-01"
  return { start, end }
}
```

In your services, apply the start/end in Klaviyo queries, e.g., `?filter=greater-or-equal(created,'2023-08-01T00:00:00Z')`.
