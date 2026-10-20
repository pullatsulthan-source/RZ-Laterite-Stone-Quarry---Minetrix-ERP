-- Transitional persistence table for the existing ERP API state model.
-- This preserves every current module while relational repositories are migrated.
CREATE TABLE IF NOT EXISTS app_state (
  id VARCHAR(64) PRIMARY KEY,
  state JSONB NOT NULL,
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
