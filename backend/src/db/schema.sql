-- ==============================================================================
-- DIGITAL BUILDING-MATERIAL MARKETPLACE & DELIVERY PLATFORM — NAGPUR | MVP
-- CORE DATABASE SCHEMA
-- ==============================================================================

-- 1. Admin Users (Authentication & Authorization)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('ADMIN', 'SUPER_ADMIN')),
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Products (MVP Materials: Sand, Bricks, Black Stone/Aggregate, Murum)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  min_quantity REAL NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  typical_use_cases TEXT,
  quality_specifications TEXT,
  availability_disclaimer TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Customers (Public request submitters; no customer login in MVP)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  whatsapp_number TEXT,
  delivery_address TEXT NOT NULL,
  area_pincode TEXT NOT NULL,
  map_pin_url TEXT,
  internal_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 4. QR Campaigns (Truck Offline Marketing Tracking)
CREATE TABLE IF NOT EXISTS qr_campaigns (
  id TEXT PRIMARY KEY,
  campaign_code TEXT UNIQUE NOT NULL,
  truck_identifier TEXT NOT NULL,
  description TEXT,
  target_url TEXT NOT NULL,
  scan_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 5. Suppliers (Asset-light managed supplier registry)
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  location_address TEXT NOT NULL,
  service_zones TEXT NOT NULL,
  supported_materials TEXT NOT NULL, -- JSON array of strings
  verification_status TEXT NOT NULL CHECK(verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
  indicative_purchase_price REAL,
  price_updated_at TEXT,
  quality_notes TEXT,
  fulfillment_notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Drivers (Asset-light driver partner registry; decoupled from specific trucks)
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  license_number TEXT,
  verification_status TEXT NOT NULL CHECK(verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
  availability_status TEXT NOT NULL CHECK(availability_status IN ('Available', 'Busy', 'Offline')) DEFAULT 'Available',
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 7. Trucks (Asset-light third-party partner logistics fleet)
CREATE TABLE IF NOT EXISTS trucks (
  id TEXT PRIMARY KEY,
  registration_number TEXT UNIQUE NOT NULL,
  capacity_tons REAL NOT NULL,
  supported_materials TEXT NOT NULL, -- JSON array of strings
  owner_name TEXT NOT NULL,
  owner_mobile TEXT NOT NULL,
  default_driver_id TEXT,
  availability_status TEXT NOT NULL CHECK(availability_status IN ('Available', 'Busy', 'Offline')) DEFAULT 'Available',
  indicative_transport_rate REAL,
  verification_status TEXT NOT NULL CHECK(verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (default_driver_id) REFERENCES drivers(id)
);

-- 8. Orders (Central business transaction entity)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_reference TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  area_pincode TEXT NOT NULL,
  preferred_delivery_date TEXT NOT NULL,
  additional_notes TEXT,
  status TEXT NOT NULL CHECK(status IN (
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
  supplier_id TEXT,
  truck_id TEXT,
  driver_id TEXT,
  qr_campaign_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (qr_campaign_id) REFERENCES qr_campaigns(id)
);

-- 9. Order Status History (Traceable audit of state transitions)
CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by_user_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_user_id) REFERENCES admin_users(id)
);

-- 10. Quotations (Quotation-first pricing snapshot model)
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  quotation_reference TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL,
  material_cost REAL NOT NULL,
  transport_cost REAL NOT NULL,
  loading_cost REAL NOT NULL DEFAULT 0,
  platform_fee REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  final_delivered_price REAL NOT NULL,
  estimated_gross_margin REAL NOT NULL,
  validity_date TEXT NOT NULL,
  notes TEXT,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES admin_users(id)
);

-- 11. Payments (Payment status tracking)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL, -- Cash, UPI, Bank Transfer, Cheque
  payment_status TEXT NOT NULL CHECK(payment_status IN ('Pending', 'Partially Paid', 'Paid', 'Refunded')),
  transaction_reference TEXT,
  notes TEXT,
  recorded_by_user_id TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by_user_id) REFERENCES admin_users(id)
);

-- 12. Financial Records (Actual costs, revenue, and gross margin per order)
CREATE TABLE IF NOT EXISTS financial_records (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  actual_revenue REAL NOT NULL DEFAULT 0,
  actual_material_cost REAL NOT NULL DEFAULT 0,
  actual_transport_cost REAL NOT NULL DEFAULT 0,
  other_direct_costs REAL NOT NULL DEFAULT 0,
  actual_gross_margin REAL NOT NULL DEFAULT 0,
  recorded_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by_user_id) REFERENCES admin_users(id)
);

-- 13. Audit Logs (Operational security audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  changes_json TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES admin_users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_truck ON orders(truck_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_drivers_mobile ON drivers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_trucks_default_driver ON trucks(default_driver_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_quotations_order ON quotations(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
