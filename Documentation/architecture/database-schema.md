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
-- Create TimescaleDB hypertables for time-series data with optimized settings
SELECT create_hypertable('klaviyo_events', 'timestamp');
SELECT add_dimension('klaviyo_events', 'metric_id', number_partitions => 4);
SELECT set_chunk_time_interval('klaviyo_events', INTERVAL '7 days');
SELECT add_compression_policy('klaviyo_events', INTERVAL '90 days');
SELECT add_retention_policy('klaviyo_events', INTERVAL '2 years');

SELECT create_hypertable('fact_revenue', 'date');
SELECT create_hypertable('fact_engagement', 'date');
SELECT create_hypertable('fact_conversions', 'date');
```

### Enhanced Performance Indexes
```sql
-- Raw data access with BRIN indexes for large tables
CREATE INDEX idx_raw_api_responses_endpoint_timestamp ON raw_api_responses(endpoint, timestamp);
CREATE INDEX idx_raw_api_responses_timestamp_brin ON raw_api_responses USING BRIN (timestamp) WITH (pages_per_range = 128);

-- Metric lookups with JSON capability
CREATE INDEX idx_klaviyo_metrics_name ON klaviyo_metrics(name);
CREATE INDEX idx_klaviyo_metrics_metadata_gin ON klaviyo_metrics USING GIN (metadata jsonb_path_ops);

-- Event analysis with optimized multi-column indexes and INCLUDE
CREATE INDEX idx_klaviyo_events_metric_timestamp ON klaviyo_events(metric_id, timestamp DESC) INCLUDE (value, properties);
CREATE INDEX idx_klaviyo_events_profile_timestamp ON klaviyo_events(profile_id, timestamp DESC);
CREATE INDEX idx_klaviyo_events_profile_metric_timestamp ON klaviyo_events(profile_id, metric_id, timestamp DESC);
CREATE INDEX idx_klaviyo_events_timestamp_brin ON klaviyo_events USING BRIN (timestamp) WITH (pages_per_range = 128);
CREATE INDEX idx_klaviyo_events_properties_gin ON klaviyo_events USING GIN (properties jsonb_path_ops);

-- Partial indexes for high-value events
CREATE INDEX idx_klaviyo_events_high_value ON klaviyo_events(value DESC, timestamp DESC) 
WHERE value > 0;

-- Campaign and flow analysis
CREATE INDEX idx_klaviyo_campaigns_sent_at ON klaviyo_campaigns(sent_at DESC);
CREATE INDEX idx_klaviyo_campaigns_status ON klaviyo_campaigns(status);
CREATE INDEX idx_klaviyo_flows_status_updated ON klaviyo_flows(status, updated_at DESC);

-- Revenue analysis with improved coverage
CREATE INDEX idx_fact_revenue_channel_date ON fact_revenue(channel, date);
CREATE INDEX idx_fact_revenue_date_revenue ON fact_revenue(date DESC, revenue DESC);

-- Engagement tracking with partial indexing
CREATE INDEX idx_fact_engagement_metric_date ON fact_engagement(metric_type, date);
CREATE INDEX idx_fact_engagement_high_rate ON fact_engagement(rate DESC, date DESC) 
WHERE rate > 5.0;

-- Model management and forecasting
CREATE INDEX idx_forecast_predictions_model_date ON forecast_predictions(model_id, date);
CREATE INDEX idx_forecast_models_active_metric ON forecast_models(active, metric_name) 
WHERE active = true;
CREATE INDEX idx_model_performance_metric_value ON model_performance(metric, value DESC);
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
