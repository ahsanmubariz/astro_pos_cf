-- Seed Tenants
INSERT OR REPLACE INTO tenants (id, name, slug, logo_url, primary_color, secondary_color, store_name, address, receipt_footer)
VALUES ('t1', 'Starbeans Coffee', 'starbeans', 'https://placehold.co/200x200?text=Logo', '#057850', '#ffffff', 'Starbeans - Downtown', '123 Coffee St, Bean City', 'Thank you for visiting Starbeans!');

-- Seed Users (PIN: 123456)
INSERT OR REPLACE INTO users (id, tenant_id, name, username, pin_hash, role, active)
VALUES ('u1', NULL, 'Super Admin', 'admin', '$2a$10$Ad6x3xwVvtRF5JLzTC2llu9EHYfofI.i5yKo5lolQuGNkAOmi5ig.', 'super_admin', 1);

INSERT OR REPLACE INTO users (id, tenant_id, name, username, pin_hash, role, active)
VALUES ('u2', 't1', 'Jane Admin', 'jane_admin', '$2a$10$Ad6x3xwVvtRF5JLzTC2llu9EHYfofI.i5yKo5lolQuGNkAOmi5ig.', 'tenant_admin', 1);

INSERT OR REPLACE INTO users (id, tenant_id, name, username, pin_hash, role, active)
VALUES ('u3', 't1', 'John Cashier', 'john_cashier', '$2a$10$Ad6x3xwVvtRF5JLzTC2llu9EHYfofI.i5yKo5lolQuGNkAOmi5ig.', 'cashier', 1);

-- Seed Products
INSERT OR REPLACE INTO products (id, tenant_id, name, category, price, stock, active)
VALUES ('p1', 't1', 'Espresso', 'Coffee', 3.50, 100, 1);

INSERT OR REPLACE INTO products (id, tenant_id, name, category, price, stock, active)
VALUES ('p2', 't1', 'Latte', 'Coffee', 4.50, 100, 1);

INSERT OR REPLACE INTO products (id, tenant_id, name, category, price, stock, active)
VALUES ('p3', 't1', 'Cappuccino', 'Coffee', 4.00, 100, 1);

INSERT OR REPLACE INTO products (id, tenant_id, name, category, price, stock, active)
VALUES ('p4', 't1', 'Croissant', 'Bakery', 2.50, 20, 1);
