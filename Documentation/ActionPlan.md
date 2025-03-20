# Klaviyo Analytics Dashboard - Implementation Action Plan

This action plan outlines the steps needed to implement the Klaviyo Analytics Dashboard backend and integrate it with the frontend. Use this document to track progress and onboard new team members.

## Project Setup & Environment Configuration

- [x] **Initialize Project Structure**
  - [x] Create repository structure following the spec layout
  - [x] Setup frontend (Next.js) and backend (Node.js/Express) folders
  - [x] Initialize package.json, tsconfig.json for both frontend and backend

- [x] **Environment Configuration**
  - [x] Create .env.example file with required variables
  - [x] Setup secure storage for Klaviyo API key
  - [x] Configure environment variable loading (dotenv)
  - [x] Implement environment validation on startup

- [x] **Dependency Installation**
  - [x] Install backend dependencies (Express, TypeScript, Jest, etc.)
  - [x] Install frontend dependencies (if not already present)
  - [x] Setup dev dependencies (ESLint, Prettier, etc.)

## CI/CD & Testing Framework

- [x] **GitHub Workflow Setup**
  - [x] Create .github/workflows/ci.yml for running tests and linting
  - [x] Configure workflow to run on PRs to main branch
  - [x] Add build status badge to README

- [x] **Testing Framework**
  - [x] Setup Jest/Vitest for unit testing
  - [x] Configure Supertest for API endpoint testing
  - [x] Create mock data fixtures for testing

## Backend API Implementation

### 1. Core Infrastructure

- [x] **API Structure**
  - [x] Create routes directory structure
  - [x] Implement middleware for error handling, logging, etc.
  - [x] Setup CORS and security middleware

- [x] **Klaviyo API Client**
  - [x] Create service for Klaviyo API authentication
  - [x] Implement base HTTP client with proper error handling
  - [x] Add retry mechanism for failed requests

- [x] **Date Range Utilities**
  - [x] Implement date range parser for formats like "last-30-days"
  - [x] Create utility for generating Klaviyo API date filters

### 2. API Endpoints

- [x] **Overview Endpoint**
  - [x] Write tests for GET /api/overview
  - [x] Implement controller and service layers
  - [x] Calculate total revenue, active subscribers, etc.
  - [x] Add period comparison logic

- [x] **Campaigns Endpoint**
  - [x] Write tests for GET /api/campaigns
  - [x] Implement controller and service layers
  - [x] Aggregate campaign metrics (open rates, click rates, etc.)
  - [x] Apply date range filtering

- [x] **Flows Endpoint**
  - [x] Write tests for GET /api/flows
  - [x] Implement controller and service layers
  - [x] Fetch flow messages and combine with events/metrics
  - [x] Calculate flow performance metrics

- [x] **Forms Endpoint**
  - [x] Write tests for GET /api/forms
  - [x] Implement controller and service layers
  - [x] Gather form views, submissions, and conversion data
  - [x] Calculate submission rates

- [x] **Segments Endpoint**
  - [x] Write tests for GET /api/segments
  - [x] Implement controller and service layers
  - [x] Get segment membership counts
  - [x] Calculate segment-specific metrics

### 3. Performance Optimization

- [x] **Caching Strategy**
  - [x] Implement response caching for expensive endpoints
  - [x] Add cache invalidation logic
  - [x] Configure cache TTL for different data types

- [x] **Rate Limiting**
  - [x] Research Klaviyo API rate limits
  - [x] Implement request throttling to avoid rate limits
  - [x] Add queuing mechanism for large batch requests
  - [x] Adjust rate limits to accommodate frontend concurrent requests

## Frontend Integration

- [x] **API Client**
  - [x] Create API client functions for each endpoint
  - [x] Add error handling and loading states
  - [x] Implement date range selection logic
  - [x] Add client-side caching to reduce API requests

- [x] **State Management**
  - [x] Setup state management for dashboard data
  - [x] Implement data fetching hooks
  - [x] Add period comparison calculations
  - [x] Implement lazy loading for tab content

- [x] **Dashboard Components**
  - [x] Connect overview metrics to API
  - [x] Integrate campaigns table with API data
  - [x] Connect flows section to backend data
  - [x] Link forms metrics to API
  - [x] Add segments data if needed
  - [x] Keep metric cards visible across all tabs
  - [x] Add data visualizations to overview tab

- [x] **Loading & Error States**
  - [x] Implement skeleton loaders for data fetching
  - [x] Add error handling UI components
  - [x] Create retry mechanisms for failed requests
  - [x] Add cache status indicators

## Testing & Quality Assurance

- [x] **Unit Testing**
  - [x] Achieve >80% test coverage for backend services
  - [x] Test date range parsing logic thoroughly
  - [x] Verify error handling and edge cases
  - [x] Fix Jest open handles issue by adding `--detectOpenHandles` flag and resolving async operations

- [x] **Integration Testing**
  - [x] Test all API endpoints with various parameters
  - [x] Verify data transformation logic
  - [x] Test with different date ranges

- [x] **End-to-End Testing**
  - [x] Create basic E2E tests for the dashboard
  - [x] Test date range selection functionality
  - [x] Verify metrics calculation accuracy
  - [x] Implement backend connectivity tests
  - [x] Create E2E test runner with mock/real API options

## Documentation & Deployment

- [x] **API Documentation**
  - [x] Document all endpoints with request/response examples
  - [ ] Create Postman collection for API testing
  - [x] Add endpoint descriptions to README

- [x] **Setup Guide**
  - [x] Create detailed setup instructions
  - [x] Document environment variables
  - [x] Add troubleshooting section

- [x] **Development Deployment**
  - [x] Setup development environment on staging server
  - [x] Configure CI/CD pipeline for automatic deployment
  - [x] Implement feature flags for testing new features

- [ ] **Production Deployment**
  - [ ] Configure production environment
  - [ ] Setup secure environment variables
  - [ ] Document deployment process

## Frontend-Backend Integration

- [x] **Integration Improvements**
  - [ ] Add fallback UI state with sample data when backend is unavailable
  - [x] Improve error handling in the frontend for API connection failures
  - [x] Add clear error messages for common connection issues
  - [x] Fix React hydration errors by moving ThemeProvider to layout.tsx

- [x] **Documentation Updates**
  - [x] Update knowledge transfer document with integration information
  - [x] Add "Running the Application" section to README.md
  - [x] Create troubleshooting guide for common integration issues
  - [x] Document common React hydration errors and solutions

- [ ] **Development Experience**
  - [x] Create a combined dev script to start both frontend and backend
  - [ ] Add health check indicator in the UI for backend connectivity

## Future Enhancements

- [ ] **Additional Metrics**
  - [ ] Research additional Klaviyo metrics to include
  - [ ] Plan extensions to the dashboard

- [ ] **Data Export**
  - [ ] Add CSV/Excel export functionality
  - [ ] Implement report generation

- [ ] **Scheduled Reporting**
  - [ ] Consider adding automated report generation
  - [ ] Plan email delivery of reports

## Notes on Progress Tracking

- Mark tasks as completed by changing `[ ]` to `[x]`
- Add comments or notes under specific tasks as needed
- Update this document as new requirements emerge
