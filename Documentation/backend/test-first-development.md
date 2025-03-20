# Test-First Development Specification

This specification outlines the development approach for the backend that serves the analytics dashboard, leveraging the latest Klaviyo REST APIs (as documented in [Klaviyo's Developer Portal](https://developers.klaviyo.com/)).

## Prerequisites

1. Implement the backend in **Node.js** (TypeScript recommended) using an **Express**-style or **Next.js API routes** approach.

## Development Process

1. Create a **feature branch** (e.g., `feature/backend-campaigns-endpoint`) from `main`
2. Write **failing tests** first (TDD approach)
3. Write minimal code to pass the tests
4. Open a **Pull Request** to `main`. The CI pipeline runs tests, linting, type checks
5. Once all checks pass, code review merges it into `main`

## Environment Setup

1. **Node.js (>= 16)** and **npm** or **yarn**
2. **TypeScript** for type safety
3. **Jest** (or **Vitest**) for unit tests
4. **Supertest** for integration testing of endpoints (if using Express)
5. **Dotenv** or **Next.js environment variables** to store `KLAVIYO_API_KEY`

### Klaviyo API Key

- Store in `.env` as `KLAVIYO_API_KEY=<YOUR_KEY>` (do not commit to Git)
- The new Klaviyo endpoints use `Authorization: Klaviyo-API-Key <key>`
