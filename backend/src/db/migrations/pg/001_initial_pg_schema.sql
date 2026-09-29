-- Migration 001: Initial PostgreSQL Production Schema
-- Creates all core tables, constraints, foreign keys, and initial indexes

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_reference VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  product_id VARCHAR(64),
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

CREATE TABLE IF NOT EXISTS order_status_history (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by_user_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS order_notes (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
  author_name VARCHAR(255) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
