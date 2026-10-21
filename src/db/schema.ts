import {
  pgTable,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --------------------------------------------------------------------------
// Enums
// --------------------------------------------------------------------------

export const roleEnum = pgEnum('user_role', [
  'OWNER',
  'ADMIN',
  'ACCOUNTS',
  'QUARRY_MANAGER',
  'GATE_OPERATOR',
  'FLEET_MANAGER',
  'HR',
  'VIEWER',
]);

export const ledgerStatusEnum = pgEnum('ledger_transaction_status', [
  'DRAFT',
  'POSTED',
  'CANCELLED',
  'VOID',
]);

export const ledgerEntryTypeEnum = pgEnum('ledger_entry_type', ['DEBIT', 'CREDIT']);

export const orderStatusEnum = pgEnum('order_status', [
  'NEW',
  'CONFIRMED',
  'ALLOCATED',
  'READY_FOR_LOADING',
  'LOADING',
  'DISPATCHED',
  'DELIVERED',
  'PAYMENT_PENDING',
  'PARTIALLY_PAID',
  'PAID',
  'CANCELLED',
]);

export const loadStatusEnum = pgEnum('load_status', [
  'Draft',
  'Loaded',
  'Gate Pass Generated',
  'Dispatched',
  'Delivered',
  'Settled',
]);

// --------------------------------------------------------------------------
// 1. Quarries & Sections
// --------------------------------------------------------------------------

export const quarries = pgTable('quarries', {
  id: varchar('id', { length: 64 }).primaryKey(),
  quarryCode: varchar('quarry_code', { length: 32 }).notNull().unique(),
  quarryName: varchar('quarry_name', { length: 128 }).notNull(),
  businessName: varchar('business_name', { length: 128 }).default('RZ Mining Ventures LLP'),
  address: text('address'),
  location: varchar('location', { length: 128 }),
  phone: varchar('phone', { length: 32 }),
  email: varchar('email', { length: 128 }),
  owner: varchar('owner', { length: 128 }).default('RZ Ventures'),
  active: boolean('active').default(true).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const quarrySections = pgTable(
  'quarry_sections',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id, { onDelete: 'cascade' }),
    sectionCode: varchar('section_code', { length: 16 }).notNull(), // A, B, C (NEVER 'Medium')
    name: varchar('name', { length: 64 }).notNull(),
    description: text('description'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('quarry_sections_quarry_idx').on(table.quarryId),
    uniqueIndex('quarry_section_unique_idx').on(table.quarryId, table.sectionCode),
  ]
);

// --------------------------------------------------------------------------
// 2. Users, Roles & Quarry Memberships
// --------------------------------------------------------------------------

export const roles = pgTable('roles', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: varchar('id', { length: 128 }).primaryKey(), // Firebase UID or internal ID
  email: varchar('email', { length: 128 }).notNull().unique(),
  name: varchar('name', { length: 128 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  avatarUrl: text('avatar_url'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const quarryMemberships = pgTable(
  'quarry_memberships',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id, { onDelete: 'cascade' }),
    role: roleEnum('role').default('VIEWER').notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('membership_user_idx').on(table.userId),
    index('membership_quarry_idx').on(table.quarryId),
    uniqueIndex('membership_user_quarry_idx').on(table.userId, table.quarryId),
  ]
);

// --------------------------------------------------------------------------
// 3. Vehicles & Drivers
// --------------------------------------------------------------------------

export const vehicles = pgTable(
  'vehicles',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    vehicleNumber: varchar('vehicle_number', { length: 32 }).notNull().unique(),
    owner: varchar('owner', { length: 128 }).notNull(),
    driver: varchar('driver', { length: 128 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    category: varchar('category', { length: 64 }).default('Outside Vehicle').notNull(), // RZ Mining, Outside
    ownerType: varchar('owner_type', { length: 32 }).default('OUTSIDE').notNull(), // COMPANY, OUTSIDE
    tripRent: numeric('trip_rent', { precision: 12, scale: 2 }).default('700.00'),
    capacity: integer('capacity').default(260),
    status: varchar('status', { length: 32 }).default('Active'),
    active: boolean('active').default(true).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('vehicles_quarry_idx').on(table.quarryId)]
);

export const drivers = pgTable(
  'drivers',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    name: varchar('name', { length: 128 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    licenseNumber: varchar('license_number', { length: 64 }),
    vehicle: varchar('vehicle', { length: 32 }),
    category: varchar('category', { length: 64 }).default('Outside'),
    status: varchar('status', { length: 32 }).default('Active'),
    dailyBata: numeric('daily_bata', { precision: 12, scale: 2 }).default('600.00'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('drivers_quarry_idx').on(table.quarryId)]
);

// --------------------------------------------------------------------------
// 4. Customers & Staff
// --------------------------------------------------------------------------

export const customers = pgTable(
  'customers',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    name: varchar('name', { length: 128 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    destination: varchar('destination', { length: 256 }),
    openingBalance: numeric('opening_balance', { precision: 12, scale: 2 }).default('0.00'),
    currentBalance: numeric('current_balance', { precision: 12, scale: 2 }).default('0.00'),
    creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }).default('100000.00'),
    paymentTerms: varchar('payment_terms', { length: 64 }).default('Cash on Delivery'),
    active: boolean('active').default(true).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('customers_quarry_idx').on(table.quarryId)]
);

export const staff = pgTable(
  'staff',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    employeeId: varchar('employee_id', { length: 32 }).notNull().unique(),
    name: varchar('name', { length: 128 }).notNull(),
    role: varchar('role', { length: 64 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    dailyWage: numeric('daily_wage', { precision: 12, scale: 2 }).default('1600.00'),
    basicSalary: numeric('basic_salary', { precision: 12, scale: 2 }).default('0.00'),
    salaryType: varchar('salary_type', { length: 32 }).default('Daily Wage'),
    active: boolean('active').default(true).notNull(),
    joinDate: varchar('join_date', { length: 16 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('staff_quarry_idx').on(table.quarryId)]
);

// --------------------------------------------------------------------------
// 5. Orders (Direct Order Workflow Hub)
// --------------------------------------------------------------------------

export const orders = pgTable(
  'orders',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    orderId: varchar('order_id', { length: 32 }).notNull().unique(),
    orderDate: varchar('order_date', { length: 16 }).notNull(),
    customerId: varchar('customer_id', { length: 64 }),
    customerName: varchar('customer_name', { length: 128 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 32 }),
    deliveryLocation: text('delivery_location'),
    agentName: varchar('agent_name', { length: 128 }),
    quality: varchar('quality', { length: 64 }).notNull(),
    quantity: integer('quantity').notNull(),
    unit: varchar('unit', { length: 16 }).default('pcs').notNull(),
    rate: numeric('rate', { precision: 12, scale: 2 }).notNull(),
    grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
    commission: numeric('commission', { precision: 12, scale: 2 }).default('0.00'),
    paymentTerms: varchar('payment_terms', { length: 32 }).default('IMMEDIATE'),
    assignedVehicle: varchar('assigned_vehicle', { length: 32 }),
    driver: varchar('driver', { length: 128 }),
    requiredDate: varchar('required_date', { length: 16 }),
    remarks: text('remarks'),
    status: orderStatusEnum('status').default('NEW').notNull(),
    paymentReceived: numeric('payment_received', { precision: 12, scale: 2 }).default('0.00'),
    balance: numeric('balance', { precision: 12, scale: 2 }).default('0.00'),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('orders_quarry_idx').on(table.quarryId),
    index('orders_date_idx').on(table.orderDate),
    index('orders_status_idx').on(table.status),
  ]
);

// --------------------------------------------------------------------------
// 6. Loads & Outward Gate Passes (Direct Pit Extraction -> Direct Loading)
// --------------------------------------------------------------------------

export const loads = pgTable(
  'loads',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    sectionId: varchar('section_id', { length: 64 }),
    loadNumber: varchar('load_number', { length: 32 }).notNull().unique(),
    date: varchar('date', { length: 16 }).notNull(),
    time: varchar('time', { length: 16 }).notNull(),
    vehicleId: varchar('vehicle_id', { length: 64 }),
    vehicleNumber: varchar('vehicle_number', { length: 32 }).notNull(),
    vehicleCategory: varchar('vehicle_category', { length: 64 }).notNull(),
    driverId: varchar('driver_id', { length: 64 }),
    driverName: varchar('driver_name', { length: 128 }).notNull(),
    ownerName: varchar('owner_name', { length: 128 }),
    customerId: varchar('customer_id', { length: 64 }),
    customerName: varchar('customer_name', { length: 128 }).notNull(),
    destination: varchar('destination', { length: 256 }),
    material: varchar('material', { length: 64 }).notNull(),
    quantity: integer('quantity').notNull(),
    unit: varchar('unit', { length: 16 }).default('pcs').notNull(),

    // Capacity & actual physical billing fields (Rule 9)
    capacity: integer('capacity').default(260),
    freeQuantity: integer('free_quantity').default(5),
    ratedQuantity: integer('rated_quantity').default(255),
    actualLoadedQuantity: integer('actual_loaded_quantity'),
    actualGateOutQuantity: integer('actual_gate_out_quantity'),
    billableQuantity: integer('billable_quantity'),
    vehicleReceivedQuantity: integer('vehicle_received_quantity'),

    rateCondition: varchar('rate_condition', { length: 32 }).default('Standard Rock'),
    gapPosition: integer('gap_position').default(1),
    roundNumber: integer('round_number').default(1),
    isSpecialTradingLoad: boolean('is_special_trading_load').default(false),
    loadType: varchar('load_type', { length: 32 }).default('QUARRY_SALE'),
    loadingPaidByQuarry: boolean('loading_paid_by_quarry').default(false),

    quarryRate: numeric('quarry_rate', { precision: 12, scale: 2 }).notNull(),
    quarryAmount: numeric('quarry_amount', { precision: 12, scale: 2 }).notNull(),
    customerSaleRate: numeric('customer_sale_rate', { precision: 12, scale: 2 }).notNull(),
    customerSaleAmount: numeric('customer_sale_amount', { precision: 12, scale: 2 }).notNull(),

    driverBatta: numeric('driver_batta', { precision: 12, scale: 2 }).default('0.00'),
    vehicleTripRent: numeric('vehicle_trip_rent', { precision: 12, scale: 2 }).default('0.00'),
    loadingCharge: numeric('loading_charge', { precision: 12, scale: 2 }).default('0.00'),
    diesel: numeric('diesel', { precision: 12, scale: 2 }).default('0.00'),
    orderCommission: numeric('order_commission', { precision: 12, scale: 2 }).default('0.00'),
    otherExpense: numeric('other_expense', { precision: 12, scale: 2 }).default('0.00'),
    totalExpense: numeric('total_expense', { precision: 12, scale: 2 }).default('0.00'),
    netProfit: numeric('net_profit', { precision: 12, scale: 2 }).default('0.00'),

    paymentReceived: numeric('payment_received', { precision: 12, scale: 2 }).default('0.00'),
    balance: numeric('balance', { precision: 12, scale: 2 }).default('0.00'),
    status: loadStatusEnum('status').default('Loaded').notNull(),
    gatePassNumber: varchar('gate_pass_number', { length: 32 }),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    remarks: text('remarks'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('loads_quarry_idx').on(table.quarryId),
    index('loads_date_idx').on(table.date),
    index('loads_vehicle_idx').on(table.vehicleNumber),
  ]
);

export const gatePasses = pgTable(
  'gate_passes',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    gatePassNumber: varchar('gate_pass_number', { length: 32 }).notNull().unique(),
    date: varchar('date', { length: 16 }).notNull(),
    time: varchar('time', { length: 16 }).notNull(),
    loadId: varchar('load_id', { length: 64 }).references(() => loads.id),
    loadNumber: varchar('load_number', { length: 32 }),
    vehicleNumber: varchar('vehicle_number', { length: 32 }).notNull(),
    owner: varchar('owner', { length: 128 }),
    driver: varchar('driver', { length: 128 }).notNull(),
    vehicleCategory: varchar('vehicle_category', { length: 64 }),
    material: varchar('material', { length: 64 }).notNull(),
    quantity: integer('quantity').notNull(),
    unit: varchar('unit', { length: 16 }).default('pcs').notNull(),

    capacity: integer('capacity').default(260),
    freeQuantity: integer('free_quantity').default(5),
    ratedQuantity: integer('rated_quantity').default(255),
    actualLoadedQuantity: integer('actual_loaded_quantity'),
    actualGateOutQuantity: integer('actual_gate_out_quantity'),
    billableQuantity: integer('billable_quantity'),

    customerName: varchar('customer_name', { length: 128 }).notNull(),
    destination: varchar('destination', { length: 256 }),
    paymentStatus: varchar('payment_status', { length: 32 }).default('Credit'),
    amountCollected: numeric('amount_collected', { precision: 12, scale: 2 }).default('0.00'),
    totalBillAmount: numeric('total_bill_amount', { precision: 12, scale: 2 }).default('0.00'),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    remarks: text('remarks'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('gate_passes_quarry_idx').on(table.quarryId),
    index('gate_passes_date_idx').on(table.date),
  ]
);

// --------------------------------------------------------------------------
// 7. Quarry Production Log (Direct Pit Face Cutting)
// --------------------------------------------------------------------------

export const production = pgTable(
  'production',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    sectionId: varchar('section_id', { length: 64 }),
    productionId: varchar('production_id', { length: 32 }).notNull().unique(),
    date: varchar('date', { length: 16 }).notNull(),
    startTime: varchar('start_time', { length: 16 }),
    endTime: varchar('end_time', { length: 16 }),
    workingHours: numeric('working_hours', { precision: 5, scale: 2 }).default('4.50'),
    section: varchar('section', { length: 64 }).default('Section A'),
    cuttingMachine: varchar('cutting_machine', { length: 128 }),
    operator: varchar('operator', { length: 128 }),
    assistantOperator: varchar('assistant_operator', { length: 128 }),
    helpers: text('helpers'),

    soilCondition: varchar('soil_condition', { length: 128 }),
    rockStrength: varchar('rock_strength', { length: 128 }),
    moisture: varchar('moisture', { length: 64 }),
    heat: varchar('heat', { length: 64 }),
    cuttingCondition: text('cutting_condition'),
    splittingCondition: text('splitting_condition'),
    cuttingNotes: text('cutting_notes'),

    totalCutQuantity: integer('total_cut_quantity').notNull(),
    finishedQuantity: integer('finished_quantity').notNull(),
    firstQualityQuantity: integer('first_quality_quantity').default(0),
    secondQualityQuantity: integer('second_quality_quantity').default(0),
    lattQuantity: integer('latt_quantity').default(0),
    muryQuantity: integer('mury_quantity').default(0),

    allocatedVehicle: varchar('allocated_vehicle', { length: 32 }),
    gapPosition: integer('gap_position').default(1),
    remarks: text('remarks'),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('production_quarry_idx').on(table.quarryId),
    index('production_date_idx').on(table.date),
  ]
);

// --------------------------------------------------------------------------
// 8. Financials: Income, Expenses, Payments & Statements
// --------------------------------------------------------------------------

export const income = pgTable(
  'income',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    date: varchar('date', { length: 16 }).notNull(),
    title: varchar('title', { length: 256 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMode: varchar('payment_mode', { length: 32 }).default('Cash'),
    reference: varchar('reference', { length: 128 }),
    customerId: varchar('customer_id', { length: 64 }),
    vehicleNumber: varchar('vehicle_number', { length: 32 }),
    receiptNumber: varchar('receipt_number', { length: 64 }),
    remarks: text('remarks'),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('income_quarry_idx').on(table.quarryId),
    index('income_date_idx').on(table.date),
  ]
);

export const expenses = pgTable(
  'expenses',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    date: varchar('date', { length: 16 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    subcategory: varchar('subcategory', { length: 64 }),
    party: varchar('party', { length: 128 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMode: varchar('payment_mode', { length: 32 }).default('Cash'),
    billNumber: varchar('bill_number', { length: 64 }),
    machineId: varchar('machine_id', { length: 64 }),
    vehicleNumber: varchar('vehicle_number', { length: 32 }),
    staffId: varchar('staff_id', { length: 64 }),
    reference: varchar('reference', { length: 128 }),
    remarks: text('remarks'),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('expenses_quarry_idx').on(table.quarryId),
    index('expenses_date_idx').on(table.date),
    index('expenses_machine_idx').on(table.machineId),
  ]
);

export const payments = pgTable(
  'payments',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    date: varchar('date', { length: 16 }).notNull(),
    customerId: varchar('customer_id', { length: 64 }).notNull(),
    customerName: varchar('customer_name', { length: 128 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMode: varchar('payment_mode', { length: 32 }).default('Cash'),
    reference: varchar('reference', { length: 128 }),
    receiptNumber: varchar('receipt_number', { length: 64 }),
    remarks: text('remarks'),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payments_quarry_idx').on(table.quarryId),
    index('payments_customer_idx').on(table.customerId),
  ]
);

export const statements = pgTable(
  'statements',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    invoiceNumber: varchar('invoice_number', { length: 64 }).notNull().unique(),
    date: varchar('date', { length: 16 }).notNull(),
    clientCode: varchar('client_code', { length: 32 }),
    customerId: varchar('customer_id', { length: 64 }),
    customerName: varchar('customer_name', { length: 128 }).notNull(),
    ownerName: varchar('owner_name', { length: 128 }),
    driverName: varchar('driver_name', { length: 128 }),
    phoneNumber: varchar('phone_number', { length: 32 }),
    vehicleNumber: varchar('vehicle_number', { length: 32 }),
    fromDate: varchar('from_date', { length: 16 }).notNull(),
    toDate: varchar('to_date', { length: 16 }).notNull(),
    materialFilter: varchar('material_filter', { length: 64 }).default('All'),
    totalQuantity: integer('total_quantity').default(0),
    totalLoads: integer('total_loads').default(0),
    grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).notNull(),
    amountInWords: text('amount_in_words'),
    qualitySummary: jsonb('quality_summary'),
    generatedBy: varchar('generated_by', { length: 64 }).notNull(),
    generatedAt: varchar('generated_at', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('statements_quarry_idx').on(table.quarryId),
    index('statements_customer_idx').on(table.customerId),
  ]
);

// --------------------------------------------------------------------------
// 9. Rates & Rotations
// --------------------------------------------------------------------------

export const rates = pgTable(
  'rates',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    sectionId: varchar('section_id', { length: 64 }),
    effectiveDate: varchar('effective_date', { length: 16 }).notNull(),
    ratesData: jsonb('rates_data').notNull(),
    updatedBy: varchar('updated_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('rates_quarry_idx').on(table.quarryId)]
);

export const rotations = pgTable(
  'rotations',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    rotationDate: varchar('rotation_date', { length: 16 }).notNull(),
    rotationNumber: integer('rotation_number').default(1),
    entries: jsonb('entries').notNull(),
    status: varchar('status', { length: 32 }).default('Active'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('rotations_quarry_idx').on(table.quarryId),
    uniqueIndex('rotations_date_unique_idx').on(table.quarryId, table.rotationDate),
  ]
);

// --------------------------------------------------------------------------
// 10. Vehicle Transactions & Driver Collections (Unified Vehicle Accounting)
// --------------------------------------------------------------------------

export const vehicleTransactions = pgTable(
  'vehicle_transactions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    vehicleId: varchar('vehicle_id', { length: 64 }),
    vehicleNumber: varchar('vehicle_number', { length: 32 }).notNull(),
    date: varchar('date', { length: 16 }).notNull(),
    type: varchar('type', { length: 32 }).notNull(), // Income, Expense, Receivable, Payable
    category: varchar('category', { length: 64 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    description: text('description'),
    tripId: varchar('trip_id', { length: 64 }),
    driverId: varchar('driver_id', { length: 64 }),
    paymentMode: varchar('payment_mode', { length: 32 }).default('Cash'),
    reference: varchar('reference', { length: 128 }),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('vtx_quarry_idx').on(table.quarryId),
    index('vtx_vehicle_idx').on(table.vehicleNumber),
  ]
);

export const driverCollections = pgTable(
  'driver_collections',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    date: varchar('date', { length: 16 }).notNull(),
    driverId: varchar('driver_id', { length: 64 }),
    driverName: varchar('driver_name', { length: 128 }).notNull(),
    vehicleNumber: varchar('vehicle_number', { length: 32 }).notNull(),
    totalBilled: numeric('total_billed', { precision: 12, scale: 2 }).default('0.00'),
    collectedAmount: numeric('collected_amount', { precision: 12, scale: 2 }).default('0.00'),
    pendingAmount: numeric('pending_amount', { precision: 12, scale: 2 }).default('0.00'),
    dieselExpense: numeric('diesel_expense', { precision: 12, scale: 2 }).default('0.00'),
    battaExpense: numeric('batta_expense', { precision: 12, scale: 2 }).default('0.00'),
    netRemitted: numeric('net_remitted', { precision: 12, scale: 2 }).default('0.00'),
    status: varchar('status', { length: 32 }).default('Settled'),
    remarks: text('remarks'),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('driver_collections_quarry_idx').on(table.quarryId)]
);

// --------------------------------------------------------------------------
// 11. Machinery, JCB Work Logs, Fuel & Maintenance
// --------------------------------------------------------------------------

export const machinery = pgTable(
  'machinery',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    machineId: varchar('machine_id', { length: 32 }).notNull().unique(), // e.g. MCH-CM-01, MCH-JCB-01
    name: varchar('name', { length: 128 }).notNull(),
    type: varchar('type', { length: 64 }).notNull(),
    owner: varchar('owner', { length: 128 }).notNull(),
    ownership: varchar('ownership', { length: 64 }).default('RZ Mining Owned'),
    model: varchar('model', { length: 128 }),
    operator: varchar('operator', { length: 128 }),
    assistantOperator: varchar('assistant_operator', { length: 128 }),
    status: varchar('status', { length: 32 }).default('Active'),
    installationDate: varchar('installation_date', { length: 16 }),
    hourMeter: numeric('hour_meter', { precision: 10, scale: 2 }).default('0.00'),
    replacedByMachineId: varchar('replaced_by_machine_id', { length: 32 }),
    replacementDate: varchar('replacement_date', { length: 16 }),
    replacementReason: text('replacement_reason'),
    notes: text('notes'),
    photoUrl: text('photo_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('machinery_quarry_idx').on(table.quarryId)]
);

export const machineWorkLogs = pgTable(
  'machine_work_logs',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    machineId: varchar('machine_id', { length: 32 }).notNull(),
    date: varchar('date', { length: 16 }).notNull(),
    operator: varchar('operator', { length: 128 }).notNull(),
    startHourReading: numeric('start_hour_reading', { precision: 10, scale: 2 }).notNull(),
    endHourReading: numeric('end_hour_reading', { precision: 10, scale: 2 }).notNull(),
    totalHours: numeric('total_hours', { precision: 10, scale: 2 }).notNull(),
    ratePerHour: numeric('rate_per_hour', { precision: 10, scale: 2 }).default('1400.00'), // JCB ₹1,400/hr
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    dieselResponsibility: varchar('diesel_responsibility', { length: 64 }).default('Owner'),
    reimbursedDieselAmount: numeric('reimbursed_diesel_amount', { precision: 12, scale: 2 }).default('0.00'),
    description: text('description'),
    remarks: text('remarks'),
    verifiedBy: varchar('verified_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('mwork_quarry_idx').on(table.quarryId),
    index('mwork_machine_idx').on(table.machineId),
  ]
);

export const machineFuel = pgTable(
  'machine_fuel',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    machineId: varchar('machine_id', { length: 32 }).notNull(),
    date: varchar('date', { length: 16 }).notNull(),
    fuelType: varchar('fuel_type', { length: 32 }).default('Diesel').notNull(), // Diesel, Hydraulic Oil, Gear Oil
    quantityLitres: numeric('quantity_litres', { precision: 10, scale: 2 }).notNull(),
    ratePerLitre: numeric('rate_per_litre', { precision: 10, scale: 2 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    vendorShop: varchar('vendor_shop', { length: 128 }),
    billNumber: varchar('bill_number', { length: 64 }),
    paymentStatus: varchar('payment_status', { length: 32 }).default('Paid'),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    remarks: text('remarks'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('mfuel_quarry_idx').on(table.quarryId),
    index('mfuel_machine_idx').on(table.machineId),
  ]
);

export const machineMaintenance = pgTable(
  'machine_maintenance',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }).references(() => quarries.id),
    machineId: varchar('machine_id', { length: 32 }).notNull(),
    date: varchar('date', { length: 16 }).notNull(),
    maintenanceType: varchar('maintenance_type', { length: 64 }).default('Preventive'),
    description: text('description').notNull(),
    partsReplaced: text('parts_replaced'),
    partsCost: numeric('parts_cost', { precision: 12, scale: 2 }).default('0.00'),
    technicianLabourCost: numeric('technician_labour_cost', { precision: 12, scale: 2 }).default('0.00'),
    totalCost: numeric('total_cost', { precision: 12, scale: 2 }).notNull(),
    technicianVendor: varchar('technician_vendor', { length: 128 }),
    billNumber: varchar('bill_number', { length: 64 }),
    machineHoursAtService: numeric('machine_hours_at_service', { precision: 10, scale: 2 }),
    nextServiceDueHours: numeric('next_service_due_hours', { precision: 10, scale: 2 }),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('mmaint_quarry_idx').on(table.quarryId),
    index('mmaint_machine_idx').on(table.machineId),
  ]
);

// --------------------------------------------------------------------------
// 12. Payroll (Staff Attendance & Salary Calculation)
// --------------------------------------------------------------------------

export const payroll = pgTable(
  'payroll',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    staffId: varchar('staff_id', { length: 64 }).notNull(),
    employeeName: varchar('employee_name', { length: 128 }).notNull(),
    role: varchar('role', { length: 64 }).notNull(),
    month: varchar('month', { length: 16 }).notNull(), // YYYY-MM
    basicSalaryOrDailyRate: numeric('basic_salary_or_daily_rate', { precision: 12, scale: 2 }).notNull(),
    salaryType: varchar('salary_type', { length: 32 }).default('Daily Wage'),
    daysPresent: integer('days_present').default(0),
    halfDays: integer('half_days').default(0),
    daysAbsent: integer('days_absent').default(0),
    daysLeave: integer('days_leave').default(0),
    overtimeHours: numeric('overtime_hours', { precision: 6, scale: 2 }).default('0.00'),
    overtimePay: numeric('overtime_pay', { precision: 12, scale: 2 }).default('0.00'),
    regularGross: numeric('regular_gross', { precision: 12, scale: 2 }).default('0.00'),
    bonus: numeric('bonus', { precision: 12, scale: 2 }).default('0.00'),
    grossSalary: numeric('gross_salary', { precision: 12, scale: 2 }).notNull(),
    advancesDeducted: numeric('advances_deducted', { precision: 12, scale: 2 }).default('0.00'),
    otherDeductions: numeric('other_deductions', { precision: 12, scale: 2 }).default('0.00'),
    foodAllowance: numeric('food_allowance', { precision: 12, scale: 2 }).default('0.00'),
    netSalary: numeric('net_salary', { precision: 12, scale: 2 }).notNull(),
    paymentStatus: varchar('payment_status', { length: 32 }).default('Paid'),
    paymentDate: varchar('payment_date', { length: 16 }),
    paymentMode: varchar('payment_mode', { length: 32 }).default('Bank Transfer'),
    reference: varchar('reference', { length: 128 }),
    generatedBy: varchar('generated_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payroll_quarry_idx').on(table.quarryId),
    index('payroll_month_idx').on(table.month),
  ]
);

// --------------------------------------------------------------------------
// 13. Land Owners & Payments
// --------------------------------------------------------------------------

export const landOwners = pgTable(
  'land_owners',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    landOwnerName: varchar('land_owner_name', { length: 128 }).notNull(),
    contactPhone: varchar('contact_phone', { length: 32 }),
    surveyNumber: varchar('survey_number', { length: 64 }),
    totalLandCent: numeric('total_land_cent', { precision: 8, scale: 2 }).default('20.00'),
    initialCuttingAgreementCent: numeric('initial_cutting_agreement_cent', { precision: 8, scale: 2 }).default('14.00'),
    cuttingAreaCent: numeric('cutting_area_cent', { precision: 8, scale: 2 }).default('14.00'),
    agreementAreaCent: numeric('agreement_area_cent', { precision: 8, scale: 2 }).default('14.00'),
    referenceRatePerCent: numeric('reference_rate_per_cent', { precision: 12, scale: 2 }).default('140000.00'),
    referenceAgreementValue: numeric('reference_agreement_value', { precision: 14, scale: 2 }).default('1960000.00'),
    remainingCent: numeric('remaining_cent', { precision: 8, scale: 2 }).default('6.00'),
    undeterminedAreaCent: numeric('undetermined_area_cent', { precision: 8, scale: 2 }).default('6.00'),
    paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).default('0.00'),
    balanceAmount: numeric('balance_amount', { precision: 14, scale: 2 }).default('1960000.00'),
    sectionRate1st: numeric('section_rate_1st', { precision: 8, scale: 2 }).default('8.00'),
    sectionRate2nd: numeric('section_rate_2nd', { precision: 8, scale: 2 }).default('8.00'),
    sectionRate3rd: numeric('section_rate_3rd', { precision: 8, scale: 2 }).default('0.00'),
    notes: text('notes'),
    documents: jsonb('documents'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('land_owners_quarry_idx').on(table.quarryId)]
);

export const landOwnerPayments = pgTable(
  'land_owner_payments',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    landOwnerId: varchar('land_owner_id', { length: 64 })
      .notNull()
      .references(() => landOwners.id, { onDelete: 'cascade' }),
    date: varchar('date', { length: 16 }).notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    paymentMode: varchar('payment_mode', { length: 32 }).default('Bank Transfer'),
    reference: varchar('reference', { length: 128 }),
    receiptNumber: varchar('receipt_number', { length: 64 }),
    remarks: text('remarks'),
    enteredBy: varchar('entered_by', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('lpay_quarry_idx').on(table.quarryId),
    index('lpay_owner_idx').on(table.landOwnerId),
  ]
);

// --------------------------------------------------------------------------
// 14. Unified Ledger Architecture (Double-Entry Ledger)
// Business Transaction -> Ledger Transaction -> Ledger Entries -> Account Balance
// --------------------------------------------------------------------------

export const ledgerTransactions = pgTable(
  'ledger_transactions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    transactionNumber: varchar('transaction_number', { length: 64 }).notNull().unique(),
    transactionDate: varchar('transaction_date', { length: 16 }).notNull(),
    referenceType: varchar('reference_type', { length: 64 }).notNull(), // LOAD, GATE_PASS, PAYMENT, EXPENSE, PAYROLL, LAND
    referenceId: varchar('reference_id', { length: 64 }),
    description: text('description').notNull(),
    status: ledgerStatusEnum('status').default('POSTED').notNull(),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
    createdBy: varchar('created_by', { length: 64 }).notNull(),
    postedAt: timestamp('posted_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('ledger_tx_quarry_idx').on(table.quarryId),
    index('ledger_tx_date_idx').on(table.transactionDate),
    index('ledger_tx_ref_idx').on(table.referenceType, table.referenceId),
  ]
);

export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 })
      .notNull()
      .references(() => quarries.id),
    transactionId: varchar('transaction_id', { length: 64 })
      .notNull()
      .references(() => ledgerTransactions.id, { onDelete: 'cascade' }),
    accountCode: varchar('account_code', { length: 64 }).notNull(), // 1001-CASH, 1002-BANK, 4001-QUARRY-SALES, 5001-DIESEL, etc.
    accountName: varchar('account_name', { length: 128 }).notNull(),
    entryType: ledgerEntryTypeEnum('entry_type').notNull(), // DEBIT, CREDIT
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    description: text('description'),
    referenceType: varchar('reference_type', { length: 64 }),
    referenceId: varchar('reference_id', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('ledger_entries_quarry_idx').on(table.quarryId),
    index('ledger_entries_tx_idx').on(table.transactionId),
    index('ledger_entries_account_idx').on(table.accountCode),
  ]
);

// --------------------------------------------------------------------------
// 15. Audit Logs
// --------------------------------------------------------------------------

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    quarryId: varchar('quarry_id', { length: 64 }),
    userId: varchar('user_id', { length: 128 }),
    userName: varchar('user_name', { length: 128 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(), // CREATE, UPDATE, DELETE, DISPATCH, SETTLE, REVERSE
    entityType: varchar('entity_type', { length: 64 }).notNull(), // Load, Order, GatePass, Payment, Expense, Machine
    entityId: varchar('entity_id', { length: 64 }).notNull(),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_quarry_idx').on(table.quarryId),
    index('audit_entity_idx').on(table.entityType, table.entityId),
  ]
);

// --------------------------------------------------------------------------
// Drizzle Relations
// --------------------------------------------------------------------------

export const quarriesRelations = relations(quarries, ({ many }) => ({
  sections: many(quarrySections),
  memberships: many(quarryMemberships),
  loads: many(loads),
  gatePasses: many(gatePasses),
  production: many(production),
  orders: many(orders),
  machinery: many(machinery),
  ledgerTransactions: many(ledgerTransactions),
}));

export const quarrySectionsRelations = relations(quarrySections, ({ one }) => ({
  quarry: one(quarries, {
    fields: [quarrySections.quarryId],
    references: [quarries.id],
  }),
}));

export const ledgerTransactionsRelations = relations(ledgerTransactions, ({ one, many }) => ({
  quarry: one(quarries, {
    fields: [ledgerTransactions.quarryId],
    references: [quarries.id],
  }),
  entries: many(ledgerEntries),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  transaction: one(ledgerTransactions, {
    fields: [ledgerEntries.transactionId],
    references: [ledgerTransactions.id],
  }),
}));
