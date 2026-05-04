-- ─────────────────────────────────────────────────────────────────────────────
-- Stratix BMS — Initial Database Schema
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Custom Roles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name               VARCHAR(255) NOT NULL,
  email                   VARCHAR(255) UNIQUE NOT NULL,
  phone                   VARCHAR(30),
  designation             VARCHAR(100),
  department              VARCHAR(100),
  role                    VARCHAR(20) NOT NULL DEFAULT 'employee'
                            CHECK (role IN ('admin', 'employee')),
  role_id                 UUID REFERENCES roles(id) ON DELETE SET NULL,
  password_hash           VARCHAR(255) NOT NULL,
  two_factor_secret       VARCHAR(255),
  two_factor_enabled      BOOLEAN DEFAULT FALSE,
  failed_login_attempts   INTEGER DEFAULT 0,
  locked_until            TIMESTAMPTZ,
  is_active               BOOLEAN DEFAULT TRUE,
  is_deleted              BOOLEAN DEFAULT FALSE,
  deleted_at              TIMESTAMPTZ,
  email_verified          BOOLEAN DEFAULT TRUE,
  last_login              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── User Module Permissions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_permissions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module     VARCHAR(50) NOT NULL,
  can_access BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, module)
);

-- ─── Refresh Tokens ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  VARCHAR(50),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2FA Backup Codes ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_2fa_backup_codes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL,
  used      BOOLEAN DEFAULT FALSE,
  used_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Password History ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── User File Attachments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_attachments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name   VARCHAR(255) NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  file_size   INTEGER NOT NULL,
  mime_type   VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(20) NOT NULL
                CHECK (action IN ('CREATE','UPDATE','DELETE','VIEW','LOGIN','LOGOUT','EXPORT','IMPORT')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id   VARCHAR(255),
  description TEXT NOT NULL,
  ip_address  VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Login History ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  location   VARCHAR(255),
  status     VARCHAR(20) NOT NULL CHECK (status IN ('success','failed','locked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Product Categories ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  color_hex  VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name    VARCHAR(255) NOT NULL,
  model_no        VARCHAR(100) NOT NULL UNIQUE,
  serial_no       VARCHAR(100),
  category_id     UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  description     TEXT,
  unit_price      DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  stock_threshold INTEGER NOT NULL DEFAULT 10,
  tags            TEXT[] DEFAULT '{}',
  image           VARCHAR(500),
  is_deleted      BOOLEAN DEFAULT FALSE,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Clients ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name           VARCHAR(255) NOT NULL,
  phone               VARCHAR(30) UNIQUE NOT NULL,
  email               VARCHAR(255),
  address             TEXT,
  notes               TEXT,
  email_unsubscribed  BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Invoice Counter (sequential per year) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_counters (
  year    INTEGER PRIMARY KEY,
  counter INTEGER NOT NULL DEFAULT 0
);

-- ─── Invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  VARCHAR(20) NOT NULL UNIQUE,
  client_id       UUID NOT NULL REFERENCES clients(id),
  subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type   VARCHAR(10) DEFAULT 'flat' CHECK (discount_type IN ('flat', 'percent')),
  discount_value  DECIMAL(12,2) DEFAULT 0,
  tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total     DECIMAL(12,2) NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'Draft'
                    CHECK (status IN ('Draft','Issued','Paid','Overdue','Cancelled')),
  due_date        DATE,
  notes           TEXT,
  email_sent      BOOLEAN DEFAULT FALSE,
  email_sent_at   TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Invoice Line Items ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id            UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id            UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot VARCHAR(255) NOT NULL,
  model_no_snapshot     VARCHAR(100) NOT NULL,
  unit_price_snapshot   DECIMAL(12,2) NOT NULL,
  quantity              INTEGER NOT NULL DEFAULT 1,
  discount_type         VARCHAR(10) DEFAULT 'flat' CHECK (discount_type IN ('flat','percent')),
  discount              DECIMAL(12,2) DEFAULT 0,
  line_total            DECIMAL(12,2) NOT NULL
);

-- ─── Invoice Status History ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  old_status  VARCHAR(20),
  new_status  VARCHAR(20) NOT NULL,
  changed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Invoice Reminder Logs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_reminder_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  recipient_email VARCHAR(255) NOT NULL
);

-- ─── In-App Notifications ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  link       VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── System Announcements ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'info'
               CHECK (type IN ('info','warning','critical')),
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- ─── Database Backup Logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backup_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name    VARCHAR(255) NOT NULL,
  file_path    VARCHAR(500) NOT NULL,
  file_size_mb DECIMAL(10,2),
  status       VARCHAR(20) NOT NULL CHECK (status IN ('success','failed','in_progress')),
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_schedules (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frequency  VARCHAR(20) NOT NULL CHECK (frequency IN ('daily','weekly','monthly')),
  time       VARCHAR(5) NOT NULL DEFAULT '02:00',
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── System Settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active    ON users(is_active) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash    ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity      ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_status  ON login_history(status);

CREATE INDEX IF NOT EXISTS idx_products_model_no    ON products(model_no);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_deleted  ON products(is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm   ON products USING gin(product_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id  ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date   ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ─── Default System Settings ──────────────────────────────────────────────────
INSERT INTO system_settings (key, value) VALUES
  ('default_tax_rate',            '0'),
  ('company_name',                'Stratix'),
  ('company_address',             ''),
  ('company_logo_url',            ''),
  ('invoice_prefix',              'INV'),
  ('reminder_intervals',          '[1, 3, 7]'),
  ('low_stock_alert_enabled',     'true'),
  ('password_min_length',         '8'),
  ('password_require_uppercase',  'true'),
  ('password_require_number',     'true'),
  ('password_require_special',    'true'),
  ('2fa_required_for_admin',      'false'),
  ('max_login_attempts',          '5'),
  ('lockout_duration_minutes',    '30')
ON CONFLICT (key) DO NOTHING;

-- ─── Default Product Categories ───────────────────────────────────────────────
INSERT INTO product_categories (name, color_hex) VALUES
  ('Electronics',  '#6366f1'),
  ('Accessories',  '#8b5cf6'),
  ('Software',     '#06b6d4'),
  ('Hardware',     '#10b981'),
  ('Services',     '#f59e0b')
ON CONFLICT (name) DO NOTHING;
