-- Flows table
CREATE TABLE klaviyo_flows (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  trigger_type VARCHAR(100),
  created_date TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  metadata JSONB
);

-- Create indexes for common queries
CREATE INDEX idx_klaviyo_flows_status ON klaviyo_flows (status);
CREATE INDEX idx_klaviyo_flows_name ON klaviyo_flows (name);
CREATE INDEX idx_klaviyo_flows_created_date ON klaviyo_flows (created_date DESC);
CREATE INDEX idx_klaviyo_flows_trigger_type ON klaviyo_flows (trigger_type);

-- Add index for filtering on metrics
CREATE INDEX idx_klaviyo_flows_metrics ON klaviyo_flows (
  recipient_count, open_count, click_count, conversion_count, revenue
);

-- Add GIN index for searching within JSON metadata
CREATE INDEX idx_klaviyo_flows_metadata ON klaviyo_flows USING GIN (metadata jsonb_path_ops);