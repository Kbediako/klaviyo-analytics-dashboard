# Phase 2: Database Implementation (Weeks 3-4)

## Overview

This phase focuses on implementing the data persistence layer using PostgreSQL with TimescaleDB for time-series optimization.

## Timeline

- Week 3: Database Setup and Schema Creation
- Week 4: Database Connection and Repository Implementation

## Implementation Details

### 2.1 Set Up PostgreSQL with TimescaleDB (Week 3)

```yaml
# docker-compose.yml
version: '3'

services:
  timescaledb:
    image: timescale/timescaledb:latest-pg14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=klaviyo
      - POSTGRES_PASSWORD=klaviyo_pass
      - POSTGRES_DB=klaviyo_analytics
    volumes:
      - timescaledb_data:/var/lib/postgresql/data

volumes:
  timescaledb_data:
```

### 2.2 Create Database Schema (Week 3)

```sql
-- db/migrations/001_initial_schema.sql

-- Metrics table
CREATE TABLE klaviyo_metrics (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  integration_id VARCHAR(50),
  integration_name VARCHAR(255),
  integration_category VARCHAR(255),
  metadata JSONB
);

-- Profiles table
CREATE TABLE klaviyo_profiles (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  external_id VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  properties JSONB,
  last_event_date TIMESTAMPTZ
);

-- Events table with time-series optimization
CREATE TABLE klaviyo_events (
  id VARCHAR(50) PRIMARY KEY,
  metric_id VARCHAR(50) NOT NULL REFERENCES klaviyo_metrics(id),
  profile_id VARCHAR(50) NOT NULL REFERENCES klaviyo_profiles(id),
  timestamp TIMESTAMPTZ NOT NULL,
  value DECIMAL(12,2),
  properties JSONB NOT NULL,
  raw_data JSONB NOT NULL
);

-- Create hypertable for time-series data
SELECT create_hypertable('klaviyo_events', 'timestamp');

-- Aggregated metrics for faster queries
CREATE TABLE klaviyo_aggregated_metrics (
  metric_id VARCHAR(50) NOT NULL REFERENCES klaviyo_metrics(id),
  time_bucket TIMESTAMPTZ NOT NULL,
  bucket_size VARCHAR(10) NOT NULL, -- '1 hour', '1 day', '1 week', etc.
  count INTEGER NOT NULL,
  sum_value DECIMAL(12,2) NOT NULL,
  min_value DECIMAL(12,2),
  max_value DECIMAL(12,2),
  avg_value DECIMAL(12,2),
  PRIMARY KEY (metric_id, time_bucket, bucket_size)
);

-- Create hypertable for aggregated metrics
SELECT create_hypertable('klaviyo_aggregated_metrics', 'time_bucket');

-- Create indexes for common queries
CREATE INDEX idx_klaviyo_events_metric_timestamp ON klaviyo_events (metric_id, timestamp DESC);
CREATE INDEX idx_klaviyo_events_profile_timestamp ON klaviyo_events (profile_id, timestamp DESC);
CREATE INDEX idx_klaviyo_profiles_email ON klaviyo_profiles (email);
CREATE INDEX idx_klaviyo_profiles_phone ON klaviyo_profiles (phone_number);
```

### 2.3 Implement Database Connection (Week 4)

```typescript
// backend/src/database/index.ts
import { Pool, PoolClient } from 'pg';

class Database {
  private static instance: Database;
  private pool: Pool;
  
  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'klaviyo',
      password: process.env.DB_PASSWORD || 'klaviyo_pass',
      database: process.env.DB_NAME || 'klaviyo_analytics',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    const res = await this.pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  }
}

export const db = Database.getInstance();
```

### 2.4 Create Data Repository Classes (Week 4)

```typescript
// backend/src/repositories/metricRepository.ts
import { db } from '../database';

export interface Metric {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  integration_id?: string;
  integration_name?: string;
  integration_category?: string;
  metadata?: Record<string, any>;
}

export class MetricRepository {
  async findById(id: string): Promise<Metric | null> {
    const result = await db.query(
      'SELECT * FROM klaviyo_metrics WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  async create(metric: Omit<Metric, 'created_at' | 'updated_at'>): Promise<Metric> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_metrics (
        id, name, created_at, updated_at, integration_id, 
        integration_name, integration_category, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        metric.id,
        metric.name,
        now,
        now,
        metric.integration_id,
        metric.integration_name,
        metric.integration_category,
        metric.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
  
  async createOrUpdate(metric: Omit<Metric, 'updated_at'>): Promise<Metric> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_metrics (
        id, name, created_at, updated_at, integration_id, 
        integration_name, integration_category, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = $2,
        updated_at = $4,
        integration_id = $5,
        integration_name = $6,
        integration_category = $7,
        metadata = $8
      RETURNING *`,
      [
        metric.id,
        metric.name,
        metric.created_at || now,
        now,
        metric.integration_id,
        metric.integration_name,
        metric.integration_category,
        metric.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
}
```

## Testing

### Integration Tests

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

## Success Criteria

- [ ] TimescaleDB successfully set up and configured
- [ ] Database schema created with all required tables and indexes
- [ ] Database connection manager implemented with connection pooling
- [ ] Repository classes implemented for all entities
- [ ] Integration tests passing for all repositories
- [ ] Query performance meets requirements (sub-second response for common queries)

## Next Steps

After completing this phase:
1. Review database schema and indexing strategy
2. Document query patterns and optimization techniques
3. Begin implementing data sync service in Phase 3
4. Plan analytics engine development
