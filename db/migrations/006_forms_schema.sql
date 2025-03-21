-- Forms table
CREATE TABLE klaviyo_forms (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  form_type VARCHAR(100),
  views INTEGER DEFAULT 0,
  submissions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  metadata JSONB
);

-- Create indexes for common queries
CREATE INDEX idx_klaviyo_forms_status ON klaviyo_forms (status);
CREATE INDEX idx_klaviyo_forms_name ON klaviyo_forms (name);
CREATE INDEX idx_klaviyo_forms_created_date ON klaviyo_forms (created_date DESC);
CREATE INDEX idx_klaviyo_forms_form_type ON klaviyo_forms (form_type);

-- Add index for filtering on metrics
CREATE INDEX idx_klaviyo_forms_metrics ON klaviyo_forms (
  views, submissions, conversions
);

-- Add GIN index for searching within JSON metadata
CREATE INDEX idx_klaviyo_forms_metadata ON klaviyo_forms USING GIN (metadata jsonb_path_ops);