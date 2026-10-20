-- Durable request-level audit metadata. Existing business audit rows remain compatible.
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS request_id VARCHAR(128),
  ADD COLUMN IF NOT EXISTS http_method VARCHAR(16),
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS status_code INTEGER,
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(128),
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_created_at_idx ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_quarry_created_at_idx ON audit_logs (quarry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_created_at_idx ON audit_logs (action, created_at DESC);
