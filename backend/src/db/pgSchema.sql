-- ==============================================================================
-- DIGITAL BUILDING-MATERIAL MARKETPLACE & DELIVERY PLATFORM — NAGPUR | MVP
-- PRODUCTION POSTGRESQL SCHEMA (PHASE 4)
-- ==============================================================================

-- 0. Schema Migrations Tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1. Admin Users (Authentication & Multi-User RBAC: ADMIN / SUPER_ADMIN)
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('ADMIN', 'SUPER_ADMIN')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- 2. Products (Legacy & Baseline Catalog Entity)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  min_quantity NUMERIC(10,2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  typical_use_cases TEXT,
  quality_specifications TEXT,
  availability_disclaimer TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- 2a. Product Categories (Sand, Bricks, Black Stone / Aggregate, Murum)
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);

-- 2b. Product Variants / Subtypes (11 Variants from Phase 3)
CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(64) PRIMARY KEY,
  category_id VARCHAR(64) NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  detailed_description TEXT,
  image_url TEXT,
  unit VARCHAR(50) NOT NULL,
  min_quantity NUMERIC(10,2) NOT NULL DEFAULT 1.0,
  indicative_price NUMERIC(12,2),
  specifications_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_product_variants_category ON product_variants(category_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_slug ON product_variants(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);

-- 3. Customers (Public quote submitters; no customer login in MVP)
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  whatsapp_number VARCHAR(20),
  delivery_address TEXT NOT NULL,
  area_pincode VARCHAR(10) NOT NULL,
  map_pin_url TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);

-- 4. QR Campaigns (Truck Offline Marketing Tracking)
CREATE TABLE IF NOT EXISTS qr_campaigns (
  id VARCHAR(64) PRIMARY KEY,
  campaign_code VARCHAR(100) UNIQUE NOT NULL,
  truck_identifier VARCHAR(100) NOT NULL,
  description TEXT,
  target_url TEXT NOT NULL,
  scan_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_qr_campaigns_code ON qr_campaigns(campaign_code);

-- 5. Suppliers (Asset-light managed supplier registry)
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  location_address TEXT NOT NULL,
  service_zones TEXT NOT NULL,
  supported_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_status VARCHAR(32) NOT NULL CHECK (verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
  indicative_purchase_price NUMERIC(12,2),
  price_updated_at TIMESTAMPTZ,
  quality_notes TEXT,
  fulfillment_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- 6. Drivers (Asset-light driver partner registry; decoupled from specific trucks)
CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  license_number VARCHAR(100),
  verification_status VARCHAR(32) NOT NULL CHECK (verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
  availability_status VARCHAR(32) NOT NULL CHECK (availability_status IN ('Available', 'Busy', 'Offline')) DEFAULT 'Available',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_drivers_mobile ON drivers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_drivers_avail ON drivers(availability_status);

-- 7. Trucks (Asset-light third-party partner logistics fleet)
CREATE TABLE IF NOT EXISTS trucks (
  id VARCHAR(64) PRIMARY KEY,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  capacity_tons NUMERIC(10,2) NOT NULL,
  supported_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_name VARCHAR(255) NOT NULL,
  owner_mobile VARCHAR(20) NOT NULL,
  default_driver_id VARCHAR(64) REFERENCES drivers(id) ON DELETE SET NULL,
  availability_status VARCHAR(32) NOT NULL CHECK (availability_status IN ('Available', 'Busy', 'Offline')) DEFAULT 'Available',
  indicative_transport_rate NUMERIC(12,2),
  verification_status VARCHAR(32) NOT NULL CHECK (verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trucks_reg ON trucks(registration_number);
CREATE INDEX IF NOT EXISTS idx_trucks_driver ON trucks(default_driver_id);
CREATE INDEX IF NOT EXISTS idx_trucks_avail ON trucks(availability_status);

-- 8. Orders (Central business transaction entity with immutable snapshots)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_reference VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  area_pincode VARCHAR(10) NOT NULL,
  preferred_delivery_date VARCHAR(50) NOT NULL,
  additional_notes TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN (
    'NEW',
    'CONTACTED',
    'QUOTATION_SENT',
    'CONFIRMED',
    'SUPPLIER_ASSIGNED',
    'TRUCK_ASSIGNED',
    'LOADING',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED'
  )),
  cancellation_reason TEXT,
  supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE RESTRICT,
  truck_id VARCHAR(64) REFERENCES trucks(id) ON DELETE RESTRICT,
  driver_id VARCHAR(64) REFERENCES drivers(id) ON DELETE RESTRICT,
  current_quotation_id VARCHAR(64),
  payment_status VARCHAR(32) NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partially Paid', 'Paid', 'Refunded')),
  qr_campaign_id VARCHAR(64) REFERENCES qr_campaigns(id) ON DELETE SET NULL,
  category_id VARCHAR(64) REFERENCES product_categories(id) ON DELETE RESTRICT,
  variant_id VARCHAR(64) REFERENCES product_variants(id) ON DELETE RESTRICT,
  specifications JSONB,
  category_name_snapshot VARCHAR(255),
  variant_name_snapshot VARCHAR(255),
  specifications_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_category ON orders(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_variant ON orders(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_truck ON orders(truck_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 9. Order Status History (Traceable audit of state transitions)
CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by_user_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- 10. Quotations (Quotation-first pricing snapshot model with exact NUMERIC currency)
CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(64) PRIMARY KEY,
  quotation_reference VARCHAR(50) UNIQUE NOT NULL,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  quotation_status VARCHAR(32) NOT NULL DEFAULT 'ISSUED' CHECK (quotation_status IN ('DRAFT', 'ISSUED', 'ACCEPTED', 'SUPERSEDED', 'REJECTED')),
  material_cost NUMERIC(12,2) NOT NULL,
  transport_cost NUMERIC(12,2) NOT NULL,
  loading_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  final_delivered_price NUMERIC(12,2) NOT NULL,
  estimated_gross_margin NUMERIC(12,2) NOT NULL,
  validity_date VARCHAR(50) NOT NULL,
  notes TEXT,
  created_by_user_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quotations_ref ON quotations(quotation_reference);
CREATE INDEX IF NOT EXISTS idx_quotations_order ON quotations(order_id);

-- 11. Payments (Payment ledger with exact NUMERIC currency)
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(32) NOT NULL CHECK (payment_status IN ('Pending', 'Partially Paid', 'Paid', 'Refunded')),
  transaction_reference VARCHAR(100),
  notes TEXT,
  recorded_by_user_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  payment_date VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- 12. Financial Records (Actual costs, revenue, and gross margin per order)
CREATE TABLE IF NOT EXISTS financial_records (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actual_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  actual_material_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  actual_transport_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  other_direct_costs NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  actual_gross_margin NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  recorded_by_user_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_financial_records_order ON financial_records(order_id);

-- 13. Audit Logs (Operational security audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  changes_json JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- 14. Order Notes (Operational internal notes)
CREATE TABLE IF NOT EXISTS order_notes (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
  author_name VARCHAR(255) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_notes_order ON order_notes(order_id);
