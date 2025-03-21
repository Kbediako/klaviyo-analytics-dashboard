# Klaviyo Analytics Dashboard - Database Implementation

This directory contains the database implementation for the Klaviyo Analytics Dashboard, using PostgreSQL with TimescaleDB for time-series optimization, enhanced with optimized indexing, connection pooling, and backup/recovery procedures.

## Overview

The enhanced database implementation includes:

1. PostgreSQL with TimescaleDB using Docker with optimized configuration
2. Database schema with time-series optimization and advanced indexing
3. Connection pooling optimized for high-load scenarios
4. Automated backup and disaster recovery procedures
5. Comprehensive monitoring and retry mechanisms
6. Migration scripts with data integrity constraints
7. Repository classes for data access with robust error handling

## Setup

### Prerequisites

- Docker and Docker Compose
- Node.js (v16 or higher)
- PostgreSQL client (for running migrations)

### Starting the Database

To start the database with all optimizations and run migrations:

```bash
./start-db.sh
```

This script will:
1. Start PostgreSQL with TimescaleDB using Docker Compose with optimized configuration
2. Configure automated backups on a schedule (hourly, daily, weekly, monthly)
3. Wait for the database to be ready
4. Run all migrations in the `migrations` directory, including optimization migrations

### Manual Setup

If you prefer to set up the database manually:

1. Start the database:
   ```bash
   docker-compose up -d timescaledb backup-service
   ```

2. Run migrations:
   ```bash
   node db/run-migrations.js
   ```

## Database Schema and Indexing

The database schema includes the following tables with enhanced indexing for optimal performance:

### klaviyo_metrics

Stores information about Klaviyo metrics (e.g., Placed Order, Viewed Product).

```sql
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

-- Index for faster searching by name
CREATE INDEX idx_klaviyo_metrics_name ON klaviyo_metrics (name);

-- GIN index for JSON metadata searching
CREATE INDEX idx_klaviyo_metrics_metadata ON klaviyo_metrics USING GIN (metadata jsonb_path_ops);
```

### klaviyo_profiles

Stores information about Klaviyo customer profiles with optimized search indexes.

```sql
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

-- Search optimization indexes
CREATE INDEX idx_klaviyo_profiles_email ON klaviyo_profiles (email);
CREATE INDEX idx_klaviyo_profiles_phone ON klaviyo_profiles (phone_number);
CREATE INDEX idx_klaviyo_profiles_external_id ON klaviyo_profiles (external_id);
CREATE INDEX idx_klaviyo_profiles_name ON klaviyo_profiles (first_name, last_name);
CREATE INDEX idx_klaviyo_profiles_last_event ON klaviyo_profiles (last_event_date DESC);
CREATE INDEX idx_klaviyo_profiles_properties_gin ON klaviyo_profiles USING GIN (properties jsonb_path_ops);
```

### klaviyo_events

Stores Klaviyo events with time-series optimization and various performance indexes for different query patterns.

```sql
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

-- Multi-column indexes for common query patterns
CREATE INDEX idx_klaviyo_events_metric_timestamp ON klaviyo_events (metric_id, timestamp DESC) INCLUDE (value, properties);
CREATE INDEX idx_klaviyo_events_profile_timestamp ON klaviyo_events (profile_id, timestamp DESC);
CREATE INDEX idx_klaviyo_events_profile_metric_timestamp ON klaviyo_events (profile_id, metric_id, timestamp DESC);

-- BRIN index for time-range scans (more efficient for large tables)
CREATE INDEX idx_klaviyo_events_timestamp_brin ON klaviyo_events USING BRIN (timestamp) WITH (pages_per_range = 128);

-- GIN index for JSON property querying
CREATE INDEX idx_klaviyo_events_properties_gin ON klaviyo_events USING GIN (properties jsonb_path_ops);

-- Partial index for high-value events
CREATE INDEX idx_klaviyo_events_high_value ON klaviyo_events (value DESC, timestamp DESC)
WHERE value > 0;
```

### klaviyo_aggregated_metrics

Stores pre-aggregated metrics for faster queries with indexing optimized for time-series analysis.

```sql
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

-- Index for recent metrics lookup
CREATE INDEX idx_klaviyo_aggregated_metrics_recent ON klaviyo_aggregated_metrics (metric_id, time_bucket DESC)
WHERE time_bucket > NOW() - INTERVAL '30 days';

-- Add compression policy for older data
SELECT add_compression_policy('klaviyo_aggregated_metrics', INTERVAL '90 days');
```

## Advanced Connection Pooling

The database connection is managed using a singleton pattern with enhanced connection pooling features:

```typescript
// Backend/src/database/index.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import logger from '../utils/logger';

class Database {
  private static instance: Database;
  private pool: Pool;
  private metrics: PoolMetrics;
  private readonly retryConfig: RetryConfig;
  private metricsInterval: NodeJS.Timeout | null = null;
  
  // ...
  
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  // Enhanced query method with retry logic
  public async query(
    text: string, 
    params?: any[],
    options?: { 
      retries?: number,
      timeout?: number 
    }
  ): Promise<QueryResult> {
    // Implementation with exponential backoff retry
    // And query timeout management
  }
  
  // Get pool metrics for monitoring
  public getPoolMetrics(): PoolMetrics {
    return { ...this.metrics };
  }
  
  // Health check method
  public async healthCheck(): Promise<boolean> {
    // Implementation to check database connectivity
  }
  
  // ...
}

export const db = Database.getInstance();
```

### Key Connection Pool Enhancements:

1. **Dynamic Pool Sizing**: Automatically adjusts based on load
2. **Connection Retry Logic**: With exponential backoff and jitter
3. **Pool Metrics Collection**: For monitoring and alerting
4. **Statement Timeout**: To prevent long-running queries
5. **Query Logging**: Including slow query identification
6. **Health Check**: For monitoring database availability
7. **Error Classification**: To determine when to retry connections

## Automated Backup and Recovery

The implementation includes comprehensive automated backup and disaster recovery procedures:

### Backup Schedule

- **Hourly backups**: Retained for 24 hours
- **Daily backups**: Retained for 7 days
- **Weekly backups**: Retained for 4 weeks
- **Monthly backups**: Retained for 12 months

### Backup Features

- Automatic compression with optimal settings
- Backup integrity verification after creation
- Backup rotation with configurable retention periods
- Backup metadata tracking
- Comprehensive logging

### Recovery Features

- Verification of backup integrity before restoration
- Option to restore to a different database for testing
- Graceful handling of active connections during restore
- Ability to perform point-in-time recovery

### Using Backup and Recovery Tools

```bash
# List available backups
./db/backup/restore.sh --list

# Test a backup's integrity
./db/backup/restore.sh --test /app/backups/daily/klaviyo_analytics_20250315_120000.sql.gz

# Restore from a backup
./db/backup/restore.sh /app/backups/daily/klaviyo_analytics_20250315_120000.sql.gz

# Restore to a test database
./db/backup/restore.sh --new-db klaviyo_analytics_test /app/backups/hourly/latest.sql.gz
```

## Performance Optimizations

The database implementation includes comprehensive performance optimizations:

1. **Optimized Indexes**:
   - Multi-column indexes for common query patterns
   - BRIN indexes for time-series data
   - Partial indexes for filtered queries
   - GIN indexes for JSON field searching

2. **TimescaleDB Optimizations**:
   - Chunk time interval tuning
   - Compression policies for older data
   - Partition-wise joins and aggregations
   - Distributed hypertables for scalability

3. **Connection Pooling Enhancements**:
   - Optimized pool size configuration
   - Connection timeout and retry logic
   - Statement timeouts for query control
   - Metrics collection for monitoring

4. **PostgreSQL Configuration Tuning**:
   - Memory allocation optimization
   - Parallel query configuration
   - Autovacuum settings for large tables
   - WAL and checkpoint tuning

5. **Docker Configuration**:
   - Resource limits and allocation
   - Persistence configuration
   - Health checks and restart policies

## Environment Variables

The enhanced database implementation can be configured using the following environment variables:

### Database Connection
- `DB_HOST`: Database host (default: 'localhost')
- `DB_PORT`: Database port (default: '5432')
- `DB_USER`: Database user (default: 'klaviyo')
- `DB_PASSWORD`: Database password (default: 'klaviyo_pass')
- `DB_NAME`: Database name (default: 'klaviyo_analytics')
- `DB_SSL`: Enable SSL connection (default: 'false')

### Connection Pool Configuration
- `DB_MAX_CONNECTIONS`: Maximum number of clients in the pool (default: '50')
- `DB_MIN_CONNECTIONS`: Minimum number of idle clients (default: '5')
- `DB_IDLE_TIMEOUT`: Close idle clients after milliseconds (default: '30000')
- `DB_CONNECTION_TIMEOUT`: Connection timeout in milliseconds (default: '5000')
- `DB_STATEMENT_TIMEOUT`: Query timeout in milliseconds (default: '30000')

### Retry Configuration
- `DB_MAX_RETRIES`: Maximum number of query retry attempts (default: '3')
- `DB_INITIAL_RETRY_DELAY`: Initial retry delay in milliseconds (default: '100')
- `DB_MAX_RETRY_DELAY`: Maximum retry delay in milliseconds (default: '3000')
- `DB_RETRY_FACTOR`: Exponential backoff factor (default: '2')

### Backup Configuration
- `BACKUP_DIR`: Directory for storing backups (default: '/app/backups')
- `BACKUP_RETENTION_DAYS`: Number of days to retain backups (default: '30')
- `MAX_HOURLY_BACKUPS`: Number of hourly backups to keep (default: '24')
- `MAX_DAILY_BACKUPS`: Number of daily backups to keep (default: '7')
- `MAX_WEEKLY_BACKUPS`: Number of weekly backups to keep (default: '4')
- `MAX_MONTHLY_BACKUPS`: Number of monthly backups to keep (default: '12')

## Testing

The database implementation includes comprehensive testing approaches:

- **Unit Tests**: For repository classes and query methods
- **Integration Tests**: For database interactions and transaction handling
- **Performance Tests**: For query optimization verification
- **Load Tests**: For connection pool behavior under stress
- **Recovery Tests**: For backup/restore validation

To run the tests:

```bash
cd backend
npm test

# Run performance tests
npm run test:performance

# Run load tests
npm run test:load
```

## Repository Classes

The database implementation includes enhanced repository classes for data access:

- `MetricRepository`: For managing Klaviyo metrics
- `EventRepository`: For managing Klaviyo events
- `CampaignRepository`: For managing campaign data
- `AggregationRepository`: For pre-computed analytics data

These repositories provide methods with comprehensive error handling, retry logic, and transaction support.

## Monitoring and Observability

The database implementation includes built-in monitoring capabilities:

1. **Connection Pool Metrics**: 
   - Active/idle connections
   - Pool utilization percentage
   - Waiting client count
   - Connection age statistics

2. **Query Performance Metrics**:
   - Slow query detection and logging
   - Query timing and row counts
   - Error rate monitoring

3. **Health Checks**:
   - Database connectivity testing
   - Replica lag monitoring
   - Disk space utilization

4. **Backup Monitoring**:
   - Backup success/failure tracking
   - Backup size and duration metrics
   - Backup retention compliance

## Next Steps

After implementing the database optimizations, the next steps are:

1. Implement the advanced repositories (FlowRepository, FormRepository, SegmentRepository)
2. Develop analytics engine leveraging the optimized database structure
3. Configure monitoring dashboards for database performance
4. Implement remaining service layer enhancements
5. Integrate with frontend components

## Troubleshooting

For common database-related issues, refer to the following:

1. **Connection Pool Exhaustion**: 
   - Check pool metrics with `db.getPoolMetrics()`
   - Review application for connection leaks
   - Increase max connections if necessary

2. **Slow Queries**:
   - Check logs for queries marked as slow
   - Use `EXPLAIN ANALYZE` to diagnose performance issues
   - Review indexes or add appropriate indexes

3. **Backup Failures**:
   - Check backup logs in `/app/backups/backup.log`
   - Verify disk space availability
   - Test manual backup to isolate issues
