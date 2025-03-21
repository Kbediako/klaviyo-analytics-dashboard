-- Migration for optimizing indexes and constraints
-- Part of Phase 2: Database Implementation Gap Remediation

-- Add indexes on klaviyo_events for improved time-series querying
-- This index combines metric_id and timestamp for more efficient filtering
CREATE INDEX IF NOT EXISTS idx_klaviyo_events_metric_timestamp_range ON klaviyo_events (metric_id, timestamp DESC) INCLUDE (value, properties);

-- Index for searching events within time ranges without specifying metric
-- Useful for cross-metric analysis
CREATE INDEX IF NOT EXISTS idx_klaviyo_events_timestamp_brin ON klaviyo_events USING BRIN (timestamp)
WITH (pages_per_range = 128);

-- Create multicolumn index for profile events over time
CREATE INDEX IF NOT EXISTS idx_klaviyo_events_profile_metric_timestamp ON klaviyo_events (profile_id, metric_id, timestamp DESC);

-- Add GIN index for JSONB properties in klaviyo_events for faster JSON operations
CREATE INDEX IF NOT EXISTS idx_klaviyo_events_properties_gin ON klaviyo_events USING GIN (properties jsonb_path_ops);

-- Add partial indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_klaviyo_events_recent_high_value ON klaviyo_events (timestamp DESC, value DESC)
WHERE timestamp > NOW() - INTERVAL '90 days' AND value > 0;

-- Optimize klaviyo_profiles indexes
CREATE INDEX IF NOT EXISTS idx_klaviyo_profiles_last_event ON klaviyo_profiles (last_event_date DESC)
WHERE last_event_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_klaviyo_profiles_properties_gin ON klaviyo_profiles USING GIN (properties jsonb_path_ops);

-- Add index for case-insensitive email search
CREATE INDEX IF NOT EXISTS idx_klaviyo_profiles_email_lower ON klaviyo_profiles (LOWER(email)) 
WHERE email IS NOT NULL;

-- Optimize klaviyo_campaigns indexes
CREATE INDEX IF NOT EXISTS idx_klaviyo_campaigns_high_revenue ON klaviyo_campaigns (revenue DESC)
WHERE revenue > 0;

CREATE INDEX IF NOT EXISTS idx_klaviyo_campaigns_metadata_gin ON klaviyo_campaigns USING GIN (metadata jsonb_path_ops);

-- Add index for active campaigns
CREATE INDEX IF NOT EXISTS idx_klaviyo_campaigns_active ON klaviyo_campaigns (status, send_time DESC)
WHERE status = 'active';

-- Optimize klaviyo_aggregated_metrics
-- Improve indexes for common aggregation queries
CREATE INDEX IF NOT EXISTS idx_klaviyo_aggregated_metrics_recent ON klaviyo_aggregated_metrics (metric_id, time_bucket DESC)
WHERE time_bucket > NOW() - INTERVAL '30 days';

-- Add additional constraints for data integrity
-- Add NOT NULL constraints where applicable
ALTER TABLE klaviyo_metrics ALTER COLUMN name SET NOT NULL;
ALTER TABLE klaviyo_metrics ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE klaviyo_metrics ALTER COLUMN updated_at SET NOT NULL;

-- Add check constraints
-- Ensure timestamps are reasonable values
ALTER TABLE klaviyo_events ADD CONSTRAINT chk_klaviyo_events_timestamp_range
  CHECK (timestamp >= '2020-01-01'::timestamp AND timestamp <= NOW() + INTERVAL '1 day');

-- Ensure proper value ranges for metrics
ALTER TABLE klaviyo_aggregated_metrics ADD CONSTRAINT chk_klaviyo_aggregated_metrics_values
  CHECK (
    count >= 0 AND
    (min_value IS NULL OR max_value IS NULL OR min_value <= max_value)
  );

-- Add foreign key constraint where missing
ALTER TABLE klaviyo_events
  ADD CONSTRAINT fk_klaviyo_events_metric_id
  FOREIGN KEY (metric_id) REFERENCES klaviyo_metrics(id) ON DELETE RESTRICT;

ALTER TABLE klaviyo_events
  ADD CONSTRAINT fk_klaviyo_events_profile_id
  FOREIGN KEY (profile_id) REFERENCES klaviyo_profiles(id) ON DELETE RESTRICT;

-- Add comments for documentation
COMMENT ON INDEX idx_klaviyo_events_metric_timestamp_range IS 'Optimizes queries filtering by metric_id and timestamp range with included columns';
COMMENT ON INDEX idx_klaviyo_events_timestamp_brin IS 'BRIN index for time range queries across all metrics';
COMMENT ON INDEX idx_klaviyo_events_profile_metric_timestamp IS 'Optimizes queries for specific profile activities over time';
COMMENT ON INDEX idx_klaviyo_events_properties_gin IS 'Enables efficient JSON property filtering';
COMMENT ON INDEX idx_klaviyo_profiles_last_event IS 'Optimizes queries for recently active profiles';

-- Create view for active users
CREATE OR REPLACE VIEW active_users_last_30_days AS
SELECT 
  COUNT(DISTINCT profile_id) AS active_user_count,
  DATE_TRUNC('day', timestamp) AS activity_date
FROM klaviyo_events
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY activity_date DESC;

-- Create function to maintain aggregated metrics
CREATE OR REPLACE FUNCTION update_aggregated_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily aggregation
  INSERT INTO klaviyo_aggregated_metrics (
    metric_id, time_bucket, bucket_size, count, sum_value, min_value, max_value, avg_value
  )
  VALUES (
    NEW.metric_id,
    DATE_TRUNC('day', NEW.timestamp),
    '1 day',
    1,
    COALESCE(NEW.value, 0),
    NEW.value,
    NEW.value,
    COALESCE(NEW.value, 0)
  )
  ON CONFLICT (metric_id, time_bucket, bucket_size)
  DO UPDATE SET
    count = klaviyo_aggregated_metrics.count + 1,
    sum_value = klaviyo_aggregated_metrics.sum_value + COALESCE(NEW.value, 0),
    min_value = LEAST(klaviyo_aggregated_metrics.min_value, COALESCE(NEW.value, klaviyo_aggregated_metrics.min_value)),
    max_value = GREATEST(klaviyo_aggregated_metrics.max_value, COALESCE(NEW.value, klaviyo_aggregated_metrics.max_value)),
    avg_value = (klaviyo_aggregated_metrics.sum_value + COALESCE(NEW.value, 0)) / (klaviyo_aggregated_metrics.count + 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain aggregated metrics
DROP TRIGGER IF EXISTS trg_update_aggregated_metrics ON klaviyo_events;
CREATE TRIGGER trg_update_aggregated_metrics
AFTER INSERT ON klaviyo_events
FOR EACH ROW
EXECUTE FUNCTION update_aggregated_metrics();

-- Create hypertable partitioning policy to optimize chunk size
SELECT add_dimension('klaviyo_events', 'metric_id', number_partitions => 4);
SELECT set_chunk_time_interval('klaviyo_events', INTERVAL '7 days');

-- Add compression policy for old data to save space
SELECT add_compression_policy('klaviyo_events', INTERVAL '90 days');

-- Setup retention policy for data older than 2 years
SELECT add_retention_policy('klaviyo_events', INTERVAL '2 years');