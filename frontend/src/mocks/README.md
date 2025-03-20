# Mock Service Worker (MSW) Setup for Klaviyo Analytics Dashboard

This directory contains the setup for [Mock Service Worker (MSW)](https://mswjs.io/), a library that allows you to intercept and mock API requests at the network level. This is useful for testing the application without making live API calls to Klaviyo.

## Files

- `mockData.ts` - Contains mock data for all API endpoints
- `handlers.ts` - Defines request handlers for each API endpoint
- `browser.ts` - MSW setup for browser environments
- `server.ts` - MSW setup for Node.js environments (for server-side rendering)
- `index.ts` - Main entry point that initializes MSW based on the environment

## Installation

To use MSW, you need to install it first:

```bash
npm install --save-dev msw
```

## Usage

### 1. Initialize MSW in your application

Import and call the `initMsw` function in your application entry point:

```tsx
// app/layout.tsx or pages/_app.tsx
import { initMsw } from '@/mocks';

// Initialize MSW in development mode
if (process.env.NODE_ENV === 'development') {
  initMsw();
}
```

### 2. Enable API mocking

Set the `NEXT_PUBLIC_API_MOCKING` environment variable to `enabled`:

```bash
# In your .env.local file
NEXT_PUBLIC_API_MOCKING=enabled
```

Or when starting the development server:

```bash
NEXT_PUBLIC_API_MOCKING=enabled npm run dev
```

### 3. Verify it's working

Open your browser's console. You should see a message like:

```
🔶 Mock Service Worker enabled in browser
```

And when you make API requests, you should see log messages like:

```
MSW intercepted: GET /api/overview with dateRange=last-30-days
```

## Customizing Mock Data

To customize the mock data, edit the `mockData.ts` file. You can add more realistic data or edge cases as needed.

## Adding New Endpoints

To add a new endpoint:

1. Add the mock data to `mockData.ts`
2. Add a request handler in `handlers.ts`

Example:

```typescript
// In handlers.ts
rest.get(`${API_BASE_URL}/new-endpoint`, (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json(mockData.newEndpoint)
  );
}),
```

## Testing Error Scenarios

You can test error scenarios using the `/api/error-test` endpoint:

```typescript
// Rate limit error
fetch(`${API_BASE_URL}/error-test?type=rate-limit`)
  .then(response => response.json())
  .then(data => console.log(data));

// Server error
fetch(`${API_BASE_URL}/error-test?type=server-error`)
  .then(response => response.json())
  .then(data => console.log(data));

// Unauthorized error
fetch(`${API_BASE_URL}/error-test?type=unauthorized`)
  .then(response => response.json())
  .then(data => console.log(data));
```

## Disabling MSW

To disable MSW and use the real API:

1. Remove the `NEXT_PUBLIC_API_MOCKING` environment variable or set it to a value other than `enabled`
2. Restart the development server

## Using with Jest Tests

To use MSW in Jest tests:

```typescript
// In your test file
import { server } from '@/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('fetches data successfully', async () => {
  // Your test code here
  // API requests will be intercepted by MSW
});
```

## Learn More

- [MSW Documentation](https://mswjs.io/docs/)
- [Using MSW with Next.js](https://mswjs.io/docs/getting-started/integrate/node)
