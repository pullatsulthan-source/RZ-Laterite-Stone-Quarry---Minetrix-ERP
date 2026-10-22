-- Required by backend/middleware/auth.ts. Safe to run repeatedly.
CREATE TABLE IF NOT EXISTS user_quarry_permissions (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quarry_id VARCHAR(64) NOT NULL REFERENCES quarries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS user_quarry_permissions_user_quarry_idx
  ON user_quarry_permissions (user_id, quarry_id);
CREATE INDEX IF NOT EXISTS user_quarry_permissions_user_idx
  ON user_quarry_permissions (user_id);
