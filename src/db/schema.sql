-- ==============================================================================
-- SIHub Business Assistant - PostgreSQL Production Schema
-- Safe concurrency, ACID transactions, and database-level unique constraints
-- ==============================================================================

-- 1. Services Catalog
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  prerequisites TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  recommended_for TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CRM Customers
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  company VARCHAR(255),
  tier VARCHAR(32) NOT NULL DEFAULT 'Standard' CHECK (tier IN ('Standard', 'Scale', 'Enterprise')),
  total_spend NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  booking_count INT NOT NULL DEFAULT 0,
  last_booking_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 3. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(64) PRIMARY KEY,
  service_id VARCHAR(64) NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  service_name VARCHAR(255) NOT NULL,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(64) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time VARCHAR(8) NOT NULL, -- e.g. "10:00"
  timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Mogadishu',
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending_payment', 'cancelled', 'completed', 'escalated')),
  payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'verified_paid')),
  payment_link TEXT,
  notes TEXT,
  calendar_event_id VARCHAR(128),
  whatsapp_notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DATABASE-LEVEL CONCURRENCY DEFENSE:
-- Unique partial index prevents double booking the same slot in the same timezone
-- Cancelled bookings do NOT block the slot from being reserved again.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot
ON bookings (booking_date, booking_time, timezone)
WHERE status != 'cancelled';

-- Index for date and customer queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date, timezone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 4. Audit & Security Event Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  correlation_id VARCHAR(64),
  action VARCHAR(64) NOT NULL,
  actor_role VARCHAR(32) NOT NULL DEFAULT 'customer_guest',
  actor_id VARCHAR(128),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address VARCHAR(64),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
