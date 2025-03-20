# Database Schema Design

## Overview

The database schema is designed to support both operational analytics and advanced data science capabilities while maintaining efficient query performance.

## Schema Structure

### Raw Data Tables

#### raw_api_responses
```sql
CREATE TABLE raw_api_responses (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    response_data JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    api_version VARCHAR(20) NOT NULL
);
```

#### klaviyo_metrics
```sql
CREATE TABLE klaviyo_metrics (
    metric_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### klaviyo_campaigns
```sql
CREATE TABLE klaviyo_campaigns (
    campaign_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    metadata JSONB
);
```

#### klaviyo_flows
```sql
CREATE TABLE klaviyo_flows (
    flow_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    trigger_type VARCHAR(50),
    metadata JSONB
);
```

#### klaviyo_events
```sql
CREATE TABLE klaviyo_events (
    event_id VARCHAR(50) PRIMARY KEY,
    metric_id VARCHAR(50) REFERENCES klaviyo_metrics(metric_id),
    profile_id VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL,
    value DECIMAL(12,2),
    properties JSONB
);
```

### Analytics Tables

#### fact_revenue
```sql
CREATE TABLE fact_revenue (
    date DATE NOT NULL,
    channel VARCHAR(50) NOT NULL,
    revenue DECIMAL(12,2) NOT NULL,
    order_count INTEGER NOT NULL,
    customer_count INTEGER NOT NULL,
    PRIMARY KEY (date, channel)
);
```

#### fact_engagement
```sql
CREATE TABLE fact_engagement (
    date DATE NOT NULL,
    channel VARCHAR(50) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    count INTEGER NOT NULL,
    rate DECIMAL(5,2),
    PRIMARY KEY (date, channel, metric_type)
);
```

#### fact_conversions
```sql
CREATE TABLE fact_conversions (
    date DATE NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(50) NOT NULL,
    conversions INTEGER NOT NULL,
    revenue DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (date, source_type, source_id)
);
```

#### dim_time
```sql
CREATE TABLE dim_time (
    date DATE PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    week_of_year INTEGER NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN NOT NULL
);
```

### Model Tables

#### forecast_models
```sql
CREATE TABLE forecast_models (
    model_id SERIAL PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);
```

#### forecast_predictions
```sql
CREATE TABLE forecast_predictions (
    prediction_id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES forecast_models(model_id),
    date DATE NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    confidence_lower DECIMAL(12,2),
    confidence_upper DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### model_performance
```sql
CREATE TABLE model_performance (
    model_id INTEGER REFERENCES forecast_models(model_id),
    date DATE NOT NULL,
    metric VARCHAR(50) NOT NULL,
    value DECIMAL(12,4) NOT NULL,
    PRIMARY KEY (model_id, date, metric)
);
```

## Indexing Strategy

### Time-Series Optimization
```sql
-- Create TimescaleDB hypertables for time-series data
SELECT create_hypertable('klaviyo_events', 'timestamp');
SELECT create_hypertable('fact_revenue', 'date');
SELECT create_hypertable('fact_engagement', 'date');
SELECT create_hypertable('fact_conversions', 'date');
```

### Performance Indexes
```sql
-- Raw data access
CREATE INDEX idx_raw_api_responses_endpoint_timestamp ON raw_api_responses(endpoint, timestamp);

-- Metric lookups
CREATE INDEX idx_klaviyo_metrics_name ON klaviyo_metrics(name);

-- Event analysis
CREATE INDEX idx_klaviyo_events_metric_timestamp ON klaviyo_events(metric_id, timestamp);

-- Revenue analysis
CREATE INDEX idx_fact_revenue_channel_date ON fact_revenue(channel, date);

-- Engagement tracking
CREATE INDEX idx_fact_engagement_metric_date ON fact_engagement(metric_type, date);

-- Model management
CREATE INDEX idx_forecast_predictions_model_date ON forecast_predictions(model_id, date);
```

## Data Retention

- Raw API responses: 30 days
- Event data: 12 months
- Aggregated metrics: 24 months
- Model predictions: 6 months

## Maintenance

### Regular Tasks
1. Partition cleanup (monthly)
2. Statistics update (weekly)
3. Index maintenance (weekly)
4. Aggregation refresh (daily)

### Monitoring
- Table sizes
- Index usage
- Query performance
- Storage utilization

## Security

### Access Control
```sql
-- Create read-only role for analytics
CREATE ROLE analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;

-- Create role for ETL processes
CREATE ROLE etl_writer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO etl_writer;
```

### Data Protection
- Encryption at rest
- Column-level security for sensitive data
- Audit logging for data modifications
