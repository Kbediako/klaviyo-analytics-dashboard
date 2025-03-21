-- 007_segments_schema.sql
-- Migration to create the klaviyo_segments table

-- Create the klaviyo_segments table
CREATE TABLE klaviyo_segments (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  member_count INTEGER DEFAULT 0,
  active_count INTEGER DEFAULT 0, 
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  created_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  metadata JSONB
);

-- Create indexes for common queries
CREATE INDEX idx_klaviyo_segments_status ON klaviyo_segments (status);
CREATE INDEX idx_klaviyo_segments_name ON klaviyo_segments (name);
CREATE INDEX idx_klaviyo_segments_created_date ON klaviyo_segments (created_date DESC);
CREATE INDEX idx_klaviyo_segments_updated_at ON klaviyo_segments (updated_at DESC);

-- Add index for filtering on metrics
CREATE INDEX idx_klaviyo_segments_metrics ON klaviyo_segments (
  member_count, conversion_rate, revenue
);

-- Add GIN index for searching within JSON metadata
CREATE INDEX idx_klaviyo_segments_metadata ON klaviyo_segments USING GIN (metadata jsonb_path_ops);

-- Add a check to ensure the sync_status table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'klaviyo_sync_status'
  ) THEN
    CREATE TABLE klaviyo_sync_status (
      entity VARCHAR(50) PRIMARY KEY,
      last_sync_time TIMESTAMPTZ,
      sync_status VARCHAR(50),
      error_message TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END
$$;

-- Insert or update the sync status record for segments
INSERT INTO klaviyo_sync_status (entity, last_sync_time, sync_status, updated_at)
VALUES ('segments', NULL, 'pending', NOW())
ON CONFLICT (entity)
DO UPDATE SET 
  sync_status = 'pending',
  updated_at = NOW();

-- Comment
COMMENT ON TABLE klaviyo_segments IS 'Stores Klaviyo segment data for analytics dashboard';