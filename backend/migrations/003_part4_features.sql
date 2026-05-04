-- ============================================================
-- Stratix BMS — Part 4 Feature Migration
-- Run: psql -U postgres -d stratix_bms -f 003_part4_features.sql
-- ============================================================

-- ── PAYMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount         NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) DEFAULT 'Cash',
  reference_number VARCHAR(100),
  notes          TEXT,
  paid_at        TIMESTAMPTZ DEFAULT NOW(),
  recorded_by    UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS public_token VARCHAR(255) UNIQUE DEFAULT gen_random_uuid()::text;

-- ── QUOTATIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number     VARCHAR(50) UNIQUE NOT NULL,
  client_id            UUID NOT NULL REFERENCES clients(id),
  subtotal             NUMERIC(12,2) DEFAULT 0,
  discount_type        VARCHAR(10) DEFAULT 'flat',
  discount_value       NUMERIC(12,2) DEFAULT 0,
  discount_amount      NUMERIC(12,2) DEFAULT 0,
  tax_rate             NUMERIC(5,2) DEFAULT 0,
  tax_amount           NUMERIC(12,2) DEFAULT 0,
  grand_total          NUMERIC(12,2) DEFAULT 0,
  status               VARCHAR(20) DEFAULT 'Draft',
  valid_until          DATE,
  notes                TEXT,
  converted_invoice_id UUID REFERENCES invoices(id),
  created_by           UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id          UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id            UUID REFERENCES products(id),
  product_name_snapshot VARCHAR(255) NOT NULL,
  model_no_snapshot     VARCHAR(100),
  unit_price_snapshot   NUMERIC(12,2) NOT NULL,
  quantity              INTEGER NOT NULL DEFAULT 1,
  discount_type         VARCHAR(10) DEFAULT 'flat',
  discount              NUMERIC(12,2) DEFAULT 0,
  line_total            NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS quotation_counters (
  year          INTEGER NOT NULL,
  prefix        VARCHAR(20) NOT NULL DEFAULT 'QUO',
  last_sequence INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year, prefix)
);

-- ── STOCK ADJUSTMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id),
  adjustment_type VARCHAR(30) NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after  INTEGER NOT NULL,
  reason          TEXT,
  reference_id    UUID,
  reference_type  VARCHAR(50),
  adjusted_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── EXPENSE CATEGORIES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name      VARCHAR(100) NOT NULL UNIQUE,
  color_hex VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO expense_categories (name, color_hex) VALUES
  ('Office Supplies', '#6366f1'),
  ('Utilities', '#f59e0b'),
  ('Marketing', '#10b981'),
  ('Salaries', '#ef4444'),
  ('Rent', '#8b5cf6'),
  ('Travel', '#06b6d4'),
  ('Equipment', '#f97316'),
  ('Miscellaneous', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- ── EXPENSES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID REFERENCES expense_categories(id),
  title            VARCHAR(255) NOT NULL,
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method   VARCHAR(50) DEFAULT 'Cash',
  reference_number VARCHAR(100),
  expense_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  notes            TEXT,
  receipt_url      TEXT,
  recorded_by      UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUPPLIERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone          VARCHAR(50),
  email          VARCHAR(255),
  address        TEXT,
  notes          TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── PURCHASE ORDERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number      VARCHAR(50) UNIQUE NOT NULL,
  supplier_id    UUID REFERENCES suppliers(id),
  status         VARCHAR(20) DEFAULT 'Draft',
  expected_date  DATE,
  received_date  DATE,
  notes          TEXT,
  total_amount   NUMERIC(12,2) DEFAULT 0,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id             UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id),
  quantity_ordered  INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER DEFAULT 0,
  unit_cost         NUMERIC(12,2) NOT NULL,
  line_total        NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS po_counters (
  year          INTEGER NOT NULL,
  prefix        VARCHAR(20) NOT NULL DEFAULT 'PO',
  last_sequence INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year, prefix)
);

-- ── RECURRING INVOICES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_invoice_templates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES clients(id),
  frequency      VARCHAR(20) NOT NULL,
  next_run_date  DATE NOT NULL,
  last_run_date  DATE,
  is_active      BOOLEAN DEFAULT TRUE,
  tax_rate       NUMERIC(5,2) DEFAULT 0,
  discount_type  VARCHAR(10) DEFAULT 'flat',
  discount_value NUMERIC(12,2) DEFAULT 0,
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recurring_invoice_template_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id           UUID NOT NULL REFERENCES recurring_invoice_templates(id) ON DELETE CASCADE,
  product_id            UUID REFERENCES products(id),
  product_name_snapshot VARCHAR(255) NOT NULL,
  model_no_snapshot     VARCHAR(100),
  unit_price_snapshot   NUMERIC(12,2) NOT NULL,
  quantity              INTEGER NOT NULL DEFAULT 1,
  discount_type         VARCHAR(10) DEFAULT 'flat',
  discount              NUMERIC(12,2) DEFAULT 0
);

-- ── PASSWORD RESET ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── OAUTH ────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id       VARCHAR(255);
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
