# Phase 6: Testing and Deployment (Weeks 11-12)

## Overview

This phase focuses on comprehensive testing of all components and preparing the system for production deployment.

## Timeline

- Week 11: Unit Tests and Integration Tests
- Week 12: Deployment Configuration and Documentation

## Implementation Details

### 6.1 Unit Tests for API Client and Services (Week 11)

```typescript
// backend/src/services/__tests__/klaviyoApiClient.test.ts
import { KlaviyoApiClient } from '../klaviyoApiClient';
import nock from 'nock';

describe('KlaviyoApiClient', () => {
  beforeEach(() => {
    nock.cleanAll();
  });
  
  it('should make API calls with correct headers', async () => {
    const client = new KlaviyoApiClient('test-api-key');
    
    const scope = nock('https://a.klaviyo.com')
      .get('/api/metrics')
      .matchHeader('Authorization', 'Bearer test-api-key')
      .matchHeader('revision', '2023-10-15')
      .reply(200, { data: [] });
    
    await client.get('/api/metrics');
    
    expect(scope.isDone()).toBeTruthy();
  });
  
  it('should retry on rate limiting', async () => {
    const client = new KlaviyoApiClient('test-api-key');
    
    // First request returns 429 (rate limit)
    const scope1 = nock('https://a.klaviyo.com')
      .get('/api/metrics')
      .reply(429, {}, { 'Retry-After': '1' });
    
    // Second request succeeds
    const scope2 = nock('https://a.klaviyo.com')
      .get('/api/metrics')
      .reply(200, { data: [] });
    
    await client.get('/api/metrics');
    
    expect(scope1.isDone()).toBeTruthy();
    expect(scope2.isDone()).toBeTruthy();
  });
});
```

### 6.2 Integration Tests for Database (Week 11)

```typescript
// backend/src/repositories/__tests__/metricRepository.test.ts
import { MetricRepository } from '../metricRepository';
import { db } from '../../database';

describe('MetricRepository', () => {
  beforeAll(async () => {
    // Setup test database
    await db.query(`
      CREATE TABLE IF NOT EXISTS klaviyo_metrics (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        integration_id VARCHAR(50),
        integration_name VARCHAR(255),
        integration_category VARCHAR(255),
        metadata JSONB
      )
    `);
  });
  
  afterAll(async () => {
    // Cleanup test database
    await db.query('DROP TABLE IF EXISTS klaviyo_metrics');
    await db.pool.end();
  });
  
  beforeEach(async () => {
    // Clear data before each test
    await db.query('DELETE FROM klaviyo_metrics');
  });
  
  it('should create a new metric', async () => {
    const repo = new MetricRepository();
    
    const metric = await repo.create({
      id: 'test-metric-1',
      name: 'Test Metric',
      integration_id: 'test-integration',
      integration_name: 'Test Integration',
      integration_category: 'test'
    });
    
    expect(metric).toHaveProperty('id', 'test-metric-1');
    expect(metric).toHaveProperty('name', 'Test Metric');
    
    // Verify in database
    const result = await db.query(
      'SELECT * FROM klaviyo_metrics WHERE id = $1', 
      ['test-metric-1']
    );
    expect(result.rows).toHaveLength(1);
  });
});
```

### 6.3 E2E Tests for API Endpoints (Week 11)

```typescript
// backend/src/tests/api.test.ts
import request from 'supertest';
import app from '../app';
import { db } from '../database';

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Setup test database with sample data
  });
  
  afterAll(async () => {
    await db.pool.end();
  });
  
  describe('GET /api/campaigns', () => {
    it('should return campaigns data', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .query({ dateRange: 'last-30-days' });
      
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check structure of first campaign
      const campaign = response.body[0];
      expect(campaign).toHaveProperty('id');
      expect(campaign).toHaveProperty('name');
      expect(campaign).toHaveProperty('sent');
      expect(campaign).toHaveProperty('openRate');
    });
  });
  
  describe('GET /api/analytics/forecast/:metricId', () => {
    it('should return forecast data', async () => {
      const metricId = 'test-metric-id';
      
      const response = await request(app)
        .get(`/api/analytics/forecast/${metricId}`)
        .query({ 
          dateRange: 'last-90-days',
          horizon: 30
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('forecast');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('accuracy');
      
      expect(response.body.forecast).toBeInstanceOf(Array);
      expect(response.body.forecast.length).toBe(30);
    });
  });
});
```

### 6.4 Deployment Configuration (Week 12)

```yaml
# docker-compose.prod.yml
version: '3'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    depends_on:
      - db
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
    restart: always
    
  db:
    image: timescale/timescaledb:latest-pg14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - timescaledb_data:/var/lib/postgresql/data
    restart: always

volumes:
  timescaledb_data:
```

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose API port
EXPOSE 3001

# Start application
CMD ["node", "dist/index.js"]
```

### 6.5 GitHub Actions Workflow (Week 12)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: timescale/timescaledb:latest-pg14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linter
      run: npm run lint
      
    - name: Run tests
      run: npm test
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_USER: test
        DB_PASSWORD: test
        DB_NAME: test_db
        
    - name: Build
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v2
    
    # Add deployment steps here
    # - Deploy to staging
    # - Run smoke tests
    # - Deploy to production
```

## Success Criteria

- [ ] All unit tests passing with good coverage
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] CI/CD pipeline working
- [ ] Docker containers building successfully
- [ ] Documentation complete and up to date
- [ ] Performance requirements met in production environment

## Next Steps

After completing this phase:
1. Monitor production deployment
2. Gather user feedback
3. Plan next iteration of improvements
4. Schedule regular maintenance and updates
