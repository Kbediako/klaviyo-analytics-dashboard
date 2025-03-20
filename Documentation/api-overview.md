# Klaviyo Analytics Dashboard API Overview

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3001/api
```

## Authentication

Currently, the API does not require authentication as it's designed to be used internally. The backend securely stores and uses the Klaviyo API key for all requests to the Klaviyo API.

## Date Range Format

Many endpoints accept a `dateRange` query parameter that can be in the following formats:

- Predefined ranges: `last-7-days`, `last-30-days`, `last-90-days`, `this-month`, `last-month`, `this-year`
- Custom range: `2023-01-01,2023-02-01` (ISO date format with comma separator)

If no date range is provided, the default is `last-30-days`.
