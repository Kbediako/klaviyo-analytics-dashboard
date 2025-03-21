-- Table to track data sync status
CREATE TABLE klaviyo_sync_status (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  last_sync_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL,
  record_count INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(entity_type)
);

-- Create index for quick lookup
CREATE INDEX idx_klaviyo_sync_status_entity_type ON klaviyo_sync_status (entity_type);
CREATE INDEX idx_klaviyo_sync_status_last_sync_time ON klaviyo_sync_status (last_sync_time DESC);

-- Create initial records for all entity types
INSERT INTO klaviyo_sync_status (entity_type, last_sync_time, status, created_at)
VALUES
  ('campaigns', NOW(), 'not_synced', NOW()),
  ('flows', NOW(), 'not_synced', NOW()),
  ('forms', NOW(), 'not_synced', NOW()),
  ('segments', NOW(), 'not_synced', NOW());