-- Migration 002: PostgreSQL Performance Indexes and Integrity Constraints
-- Adds optimized indexes for multi-user querying, logistics dispatch, and financial audits

-- Indexes for Order Lookups and Filtering
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

-- Indexes for Catalog Traversal
CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_category ON product_variants(category_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_slug ON product_variants(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);

-- Indexes for Quotations, Payments, and History
CREATE INDEX IF NOT EXISTS idx_quotations_ref ON quotations(quotation_reference);
CREATE INDEX IF NOT EXISTS idx_quotations_order ON quotations(order_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(quotation_status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_order ON order_notes(order_id);

-- Indexes for Multi-User Admin & Security
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Logistics Fleet Indexes
CREATE INDEX IF NOT EXISTS idx_trucks_reg ON trucks(registration_number);
CREATE INDEX IF NOT EXISTS idx_trucks_driver ON trucks(default_driver_id);
CREATE INDEX IF NOT EXISTS idx_trucks_avail ON trucks(availability_status);
CREATE INDEX IF NOT EXISTS idx_drivers_mobile ON drivers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_drivers_avail ON drivers(availability_status);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_qr_campaigns_code ON qr_campaigns(campaign_code);
