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
