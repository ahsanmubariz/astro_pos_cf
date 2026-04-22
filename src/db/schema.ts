import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#6366f1'),
  secondaryColor: text('secondary_color').default('#a855f7'),
  storeName: text('store_name').notNull(),
  address: text('address'),
  receiptFooter: text('receipt_footer'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id), // Nullable for super_admin
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  pinHash: text('pin_hash').notNull(),
  role: text('role', { enum: ['super_admin', 'tenant_admin', 'cashier'] }).notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: real('price').notNull(),
  stock: integer('stock').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  userId: text('user_id').notNull().references(() => users.id),
  openedAt: integer('opened_at', { mode: 'timestamp' }).notNull(),
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  openingCash: real('opening_cash').notNull(),
  closingCash: real('closing_cash'),
  expectedCash: real('expected_cash'),
  difference: real('difference'),
  status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  invoiceNumber: text('invoice_number').notNull().unique(),
  cashierId: text('cashier_id').notNull().references(() => users.id),
  shiftId: text('shift_id').notNull().references(() => shifts.id),
  subtotal: real('subtotal').notNull(),
  discount: real('discount').notNull().default(0),
  tax: real('tax').notNull().default(0), // Percentage
  service: real('service').notNull().default(0), // Percentage
  total: real('total').notNull(),
  notes: text('notes'),
  status: text('status', { enum: ['completed', 'cancelled'] }).notNull().default('completed'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const transactionItems = sqliteTable('transaction_items', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  productId: text('product_id').notNull().references(() => products.id),
  nameSnapshot: text('name_snapshot').notNull(),
  qty: integer('qty').notNull(),
  price: real('price').notNull(),
  total: real('total').notNull(),
  notes: text('notes'),
});

export const transactionLogs = sqliteTable('transaction_logs', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  userId: text('user_id').notNull().references(() => users.id),
  action: text('action').notNull(), // 'created', 'cancelled', 'edited'
  details: text('details'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});
