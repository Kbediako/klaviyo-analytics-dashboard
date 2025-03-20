# Klaviyo Analytics Dashboard - Database Implementation

This directory contains the database implementation for the Klaviyo Analytics Dashboard, using PostgreSQL with TimescaleDB for time-series optimization.

## Overview

The database implementation includes:

1. PostgreSQL with TimescaleDB using Docker
2. Database schema with time-series optimization
3. Migration scripts
4. Connection management
5. Repository classes for data access

## Setup

### Prerequisites

- Docker and Docker Compose
- Node.js (v16 or higher)
- PostgreSQL client (for running migrations)

### Starting the Database

To start the database and run migrations:

```bash
./start-db.sh
```

This script will:
1. Start PostgreSQL with TimescaleDB using Docker Compose
2. Wait for the database to be ready
3. Run all migrations in the `migrations` directory

### Manual Setup

If you prefer to set up the database manually:

1. Start the database:
   ```bash
   docker-compose up -d timescaledb
   ```

2. Run migrations:
   ```bash
   node db/run-migrations.js
   ```

## Database Schema

The database schema includes the following tables:

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
```

### klaviyo_profiles

Stores information about Klaviyo customer profiles.

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
```

### klaviyo_events

Stores Klaviyo events with time-series optimization.

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
```

### klaviyo_aggregated_metrics

Stores pre-aggregated metrics for faster queries.

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
```

## Repository Classes

The database implementation includes repository classes for data access:

- `MetricRepository`: For managing Klaviyo metrics
- `EventRepository`: For managing Klaviyo events

These repositories provide methods for:

- Creating, updating, and deleting records
- Finding records by various criteria
- Querying aggregated data
- Managing time-series data

## Connection Management

The database connection is managed using a singleton pattern with connection pooling:

```typescript
// backend/src/database/index.ts
import { Pool } from 'pg';

class Database {
  private static instance: Database;
  private pool: Pool;
  
  // ...
  
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  // ...
}

export const db = Database.getInstance();
```

## Environment Variables

The database connection can be configured using the following environment variables:

- `DB_HOST`: Database host (default: 'localhost')
- `DB_PORT`: Database port (default: '5432')
- `DB_USER`: Database user (default: 'klaviyo')
- `DB_PASSWORD`: Database password (default: 'klaviyo_pass')
- `DB_NAME`: Database name (default: 'klaviyo_analytics')

## Testing

The repository classes include comprehensive tests that verify:

- Creating and updating records
- Finding records by various criteria
- Querying aggregated data
- Transaction management

To run the tests:

```bash
cd backend
npm test
```

## Performance Considerations

The database implementation includes several performance optimizations:

1. **TimescaleDB Hypertables**: For efficient time-series data storage and querying
2. **Indexes**: On commonly queried columns
3. **Pre-aggregated Metrics**: For faster analytics queries
4. **Connection Pooling**: For efficient connection management
5. **Transactions**: For data integrity and performance

## Next Steps

After setting up the database, the next steps are:

1. Implement data synchronization with Klaviyo API
2. Develop analytics engine using the database
3. Integrate with frontend components
