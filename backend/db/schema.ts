import { pgTable, serial, text, varchar, integer, timestamp, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Core tables for Phase 1 — minimal fields, will be extended progressively

export const quarries = pgTable('quarries', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  gst_number: varchar('gst_number', { length: 64 }),
  branding: jsonb('branding'),
  billing_config: jsonb('billing_config'),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
  updated_at: timestamp('updated_at'),
});

export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey(), // firebase uid
  email: varchar('email', { length: 255 }).notNull(),
  display_name: varchar('display_name', { length: 255 }),
  photo_url: text('photo_url'),
  role: varchar('role', { length: 50 }).notNull().default('VIEWER'),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
  updated_at: timestamp('updated_at'),
});

export const vehicles = pgTable('vehicles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  vehicle_number: varchar('vehicle_number', { length: 64 }).notNull(),
  owner: varchar('owner', { length: 255 }),
  owner_type: varchar('owner_type', { length: 50 }),
  category: varchar('category', { length: 50 }),
  capacity: integer('capacity'),
  active: boolean('active').default(true),
  quarry_id: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
});

export const drivers = pgTable('drivers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  vehicle_id: varchar('vehicle_id', { length: 64 }).references(() => vehicles.id),
  quarry_id: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
  active: boolean('active').default(true),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
});

export const loads = pgTable('loads', {
  id: varchar('id', { length: 64 }).primaryKey(),
  load_number: varchar('load_number', { length: 64 }).notNull(),
  date: varchar('date', { length: 32 }),
  time: varchar('time', { length: 32 }),
  vehicle_number: varchar('vehicle_number', { length: 64 }),
  driver: varchar('driver', { length: 255 }),
  material: varchar('material', { length: 128 }),
  quantity: integer('quantity'),
  unit: varchar('unit', { length: 32 }),
  quarry_rate: numeric('quarry_rate', { precision: 12, scale: 2 }),
  customer_sale_rate: numeric('customer_sale_rate', { precision: 12, scale: 2 }),
  customer_sale_amount: numeric('customer_sale_amount', { precision: 14, scale: 2 }),
  status: varchar('status', { length: 64 }).default('Draft'),
  quarry_id: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
});

export const gate_passes = pgTable('gate_passes', {
  id: varchar('id', { length: 64 }).primaryKey(),
  gate_pass_number: varchar('gate_pass_number', { length: 64 }).notNull(),
  date: varchar('date', { length: 32 }),
  time: varchar('time', { length: 32 }),
  load_id: varchar('load_id', { length: 64 }).references(() => loads.id),
  vehicle_number: varchar('vehicle_number', { length: 64 }),
  driver: varchar('driver', { length: 255 }),
  material: varchar('material', { length: 128 }),
  quantity: integer('quantity'),
  payment_status: varchar('payment_status', { length: 32 }),
  amount_collected: numeric('amount_collected', { precision: 14, scale: 2 }),
  total_bill_amount: numeric('total_bill_amount', { precision: 14, scale: 2 }),
  quarry_id: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
});

export const ledger_transactions = pgTable('ledger_transactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  transaction_type: varchar('transaction_type', { length: 64 }).notNull(),
  reference_id: varchar('reference_id', { length: 128 }),
  description: text('description'),
  quarry_id: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
  transaction_date: timestamp('transaction_date').default(sql`now()`),
  status: varchar('status', { length: 32 }).default('DRAFT'),
  created_by: varchar('created_by', { length: 128 }),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
});

export const ledger_entries = pgTable('ledger_entries', {
  id: varchar('id', { length: 64 }).primaryKey(),
  transaction_id: varchar('transaction_id', { length: 64 }).references(() => ledger_transactions.id),
  account_id: varchar('account_id', { length: 128 }).notNull(),
  debit: numeric('debit', { precision: 14, scale: 2 }).default('0'),
  credit: numeric('credit', { precision: 14, scale: 2 }).default('0'),
  reference_type: varchar('reference_type', { length: 64 }),
  reference_id: varchar('reference_id', { length: 128 }),
  description: text('description'),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
});

export const audit_logs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  user_id: varchar('user_id', { length: 128 }),
  action: varchar('action', { length: 128 }),
  entity: varchar('entity', { length: 128 }),
  entity_id: varchar('entity_id', { length: 128 }),
  quarry_id: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
  before_data: jsonb('before_data'),
  after_data: jsonb('after_data'),
  reason: text('reason'),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
});

// Server-managed mapping between an authenticated user and an authorized quarry.
export const user_quarry_permissions = pgTable('user_quarry_permissions', {
  id: varchar('id', { length: 128 }).primaryKey(),
  user_id: varchar('user_id', { length: 128 }).notNull().references(() => users.id),
  quarry_id: varchar('quarry_id', { length: 64 }).notNull().references(() => quarries.id),
  created_at: timestamp('created_at').default(sql`now()`).notNull(),
});

// Durable compatibility store for the existing multi-module API state.
// Business entities are progressively normalized into the relational tables above.
export const app_state = pgTable('app_state', {
  id: varchar('id', { length: 64 }).primaryKey(),
  state: jsonb('state').notNull(),
  version: integer('version').notNull().default(1),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`).notNull(),
});
