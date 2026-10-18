-- 0001_init.sql
-- Initial schema for RZ MINETRIX (simplified for first migration)

CREATE TABLE IF NOT EXISTS quarries (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  gst_number VARCHAR(64),
  branding JSONB,
  billing_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  photo_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(64) PRIMARY KEY,
  vehicle_number VARCHAR(64) NOT NULL,
  owner VARCHAR(255),
  owner_type VARCHAR(50),
  category VARCHAR(50),
  capacity INTEGER,
  active BOOLEAN DEFAULT TRUE,
  quarry_id VARCHAR(64) REFERENCES quarries(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  vehicle_id VARCHAR(64) REFERENCES vehicles(id),
  quarry_id VARCHAR(64) REFERENCES quarries(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS loads (
  id VARCHAR(64) PRIMARY KEY,
  load_number VARCHAR(64) NOT NULL,
  date VARCHAR(32),
  time VARCHAR(32),
  vehicle_number VARCHAR(64),
  driver VARCHAR(255),
  material VARCHAR(128),
  quantity INTEGER,
  unit VARCHAR(32),
  quarry_rate NUMERIC(12,2),
  customer_sale_rate NUMERIC(12,2),
  customer_sale_amount NUMERIC(14,2),
  status VARCHAR(64) DEFAULT 'Draft',
  quarry_id VARCHAR(64) REFERENCES quarries(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS gate_passes (
  id VARCHAR(64) PRIMARY KEY,
  gate_pass_number VARCHAR(64) NOT NULL,
  date VARCHAR(32),
  time VARCHAR(32),
  load_id VARCHAR(64) REFERENCES loads(id),
  vehicle_number VARCHAR(64),
  driver VARCHAR(255),
  material VARCHAR(128),
  quantity INTEGER,
  payment_status VARCHAR(32),
  amount_collected NUMERIC(14,2),
  total_bill_amount NUMERIC(14,2),
  quarry_id VARCHAR(64) REFERENCES quarries(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id VARCHAR(64) PRIMARY KEY,
  transaction_type VARCHAR(64) NOT NULL,
  reference_id VARCHAR(128),
  description TEXT,
  quarry_id VARCHAR(64) REFERENCES quarries(id),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(32) DEFAULT 'DRAFT',
  created_by VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id VARCHAR(64) PRIMARY KEY,
  transaction_id VARCHAR(64) REFERENCES ledger_transactions(id),
  account_id VARCHAR(128) NOT NULL,
  debit NUMERIC(14,2) DEFAULT 0,
  credit NUMERIC(14,2) DEFAULT 0,
  reference_type VARCHAR(64),
  reference_id VARCHAR(128),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(128),
  action VARCHAR(128),
  entity VARCHAR(128),
  entity_id VARCHAR(128),
  quarry_id VARCHAR(64) REFERENCES quarries(id),
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
