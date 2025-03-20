-- Campaigns table
CREATE TABLE klaviyo_campaigns (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  send_time TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  metadata JSONB
);

-- Create indexes for common queries
CREATE INDEX idx_klaviyo_campaigns_send_time ON klaviyo_campaigns (send_time DESC);
CREATE INDEX idx_klaviyo_campaigns_status ON klaviyo_campaigns (status);
CREATE INDEX idx_klaviyo_campaigns_name ON klaviyo_campaigns (name);
