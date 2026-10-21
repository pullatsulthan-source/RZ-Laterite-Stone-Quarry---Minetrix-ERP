CREATE TYPE "public"."ledger_entry_type" AS ENUM('DEBIT', 'CREDIT');--> statement-breakpoint
CREATE TYPE "public"."ledger_transaction_status" AS ENUM('DRAFT', 'POSTED', 'CANCELLED', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."load_status" AS ENUM('Draft', 'Loaded', 'Gate Pass Generated', 'Dispatched', 'Delivered', 'Settled');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('NEW', 'CONFIRMED', 'ALLOCATED', 'READY_FOR_LOADING', 'LOADING', 'DISPATCHED', 'DELIVERED', 'PAYMENT_PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('OWNER', 'ADMIN', 'ACCOUNTS', 'QUARRY_MANAGER', 'GATE_OPERATOR', 'FLEET_MANAGER', 'HR', 'VIEWER');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"user_id" varchar(128),
	"user_name" varchar(128) NOT NULL,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"name" varchar(128) NOT NULL,
	"phone" varchar(32),
	"destination" varchar(256),
	"opening_balance" numeric(12, 2) DEFAULT '0.00',
	"current_balance" numeric(12, 2) DEFAULT '0.00',
	"credit_limit" numeric(12, 2) DEFAULT '100000.00',
	"payment_terms" varchar(64) DEFAULT 'Cash on Delivery',
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_collections" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"date" varchar(16) NOT NULL,
	"driver_id" varchar(64),
	"driver_name" varchar(128) NOT NULL,
	"vehicle_number" varchar(32) NOT NULL,
	"total_billed" numeric(12, 2) DEFAULT '0.00',
	"collected_amount" numeric(12, 2) DEFAULT '0.00',
	"pending_amount" numeric(12, 2) DEFAULT '0.00',
	"diesel_expense" numeric(12, 2) DEFAULT '0.00',
	"batta_expense" numeric(12, 2) DEFAULT '0.00',
	"net_remitted" numeric(12, 2) DEFAULT '0.00',
	"status" varchar(32) DEFAULT 'Settled',
	"remarks" text,
	"entered_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"name" varchar(128) NOT NULL,
	"phone" varchar(32),
	"license_number" varchar(64),
	"vehicle" varchar(32),
	"category" varchar(64) DEFAULT 'Outside',
	"status" varchar(32) DEFAULT 'Active',
	"daily_bata" numeric(12, 2) DEFAULT '600.00',
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"date" varchar(16) NOT NULL,
	"category" varchar(64) NOT NULL,
	"subcategory" varchar(64),
	"party" varchar(128) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_mode" varchar(32) DEFAULT 'Cash',
	"bill_number" varchar(64),
	"machine_id" varchar(64),
	"vehicle_number" varchar(32),
	"staff_id" varchar(64),
	"reference" varchar(128),
	"remarks" text,
	"entered_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gate_passes" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"gate_pass_number" varchar(32) NOT NULL,
	"date" varchar(16) NOT NULL,
	"time" varchar(16) NOT NULL,
	"load_id" varchar(64),
	"load_number" varchar(32),
	"vehicle_number" varchar(32) NOT NULL,
	"owner" varchar(128),
	"driver" varchar(128) NOT NULL,
	"vehicle_category" varchar(64),
	"material" varchar(64) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(16) DEFAULT 'pcs' NOT NULL,
	"capacity" integer DEFAULT 260,
	"free_quantity" integer DEFAULT 5,
	"rated_quantity" integer DEFAULT 255,
	"actual_loaded_quantity" integer,
	"actual_gate_out_quantity" integer,
	"billable_quantity" integer,
	"customer_name" varchar(128) NOT NULL,
	"destination" varchar(256),
	"payment_status" varchar(32) DEFAULT 'Credit',
	"amount_collected" numeric(12, 2) DEFAULT '0.00',
	"total_bill_amount" numeric(12, 2) DEFAULT '0.00',
	"entered_by" varchar(64) NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gate_passes_gate_pass_number_unique" UNIQUE("gate_pass_number")
);
--> statement-breakpoint
CREATE TABLE "income" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"date" varchar(16) NOT NULL,
	"title" varchar(256) NOT NULL,
	"category" varchar(64) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_mode" varchar(32) DEFAULT 'Cash',
	"reference" varchar(128),
	"customer_id" varchar(64),
	"vehicle_number" varchar(32),
	"receipt_number" varchar(64),
	"remarks" text,
	"entered_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "land_owner_payments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"land_owner_id" varchar(64) NOT NULL,
	"date" varchar(16) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"payment_mode" varchar(32) DEFAULT 'Bank Transfer',
	"reference" varchar(128),
	"receipt_number" varchar(64),
	"remarks" text,
	"entered_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "land_owners" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"land_owner_name" varchar(128) NOT NULL,
	"contact_phone" varchar(32),
	"survey_number" varchar(64),
	"total_land_cent" numeric(8, 2) DEFAULT '20.00',
	"initial_cutting_agreement_cent" numeric(8, 2) DEFAULT '14.00',
	"cutting_area_cent" numeric(8, 2) DEFAULT '14.00',
	"agreement_area_cent" numeric(8, 2) DEFAULT '14.00',
	"reference_rate_per_cent" numeric(12, 2) DEFAULT '140000.00',
	"reference_agreement_value" numeric(14, 2) DEFAULT '1960000.00',
	"remaining_cent" numeric(8, 2) DEFAULT '6.00',
	"undetermined_area_cent" numeric(8, 2) DEFAULT '6.00',
	"paid_amount" numeric(14, 2) DEFAULT '0.00',
	"balance_amount" numeric(14, 2) DEFAULT '1960000.00',
	"section_rate_1st" numeric(8, 2) DEFAULT '8.00',
	"section_rate_2nd" numeric(8, 2) DEFAULT '8.00',
	"section_rate_3rd" numeric(8, 2) DEFAULT '0.00',
	"notes" text,
	"documents" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"transaction_id" varchar(64) NOT NULL,
	"account_code" varchar(64) NOT NULL,
	"account_name" varchar(128) NOT NULL,
	"entry_type" "ledger_entry_type" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"description" text,
	"reference_type" varchar(64),
	"reference_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"transaction_number" varchar(64) NOT NULL,
	"transaction_date" varchar(16) NOT NULL,
	"reference_type" varchar(64) NOT NULL,
	"reference_id" varchar(64),
	"description" text NOT NULL,
	"status" "ledger_transaction_status" DEFAULT 'POSTED' NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"created_by" varchar(64) NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
CREATE TABLE "loads" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"section_id" varchar(64),
	"load_number" varchar(32) NOT NULL,
	"date" varchar(16) NOT NULL,
	"time" varchar(16) NOT NULL,
	"vehicle_id" varchar(64),
	"vehicle_number" varchar(32) NOT NULL,
	"vehicle_category" varchar(64) NOT NULL,
	"driver_id" varchar(64),
	"driver_name" varchar(128) NOT NULL,
	"owner_name" varchar(128),
	"customer_id" varchar(64),
	"customer_name" varchar(128) NOT NULL,
	"destination" varchar(256),
	"material" varchar(64) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(16) DEFAULT 'pcs' NOT NULL,
	"capacity" integer DEFAULT 260,
	"free_quantity" integer DEFAULT 5,
	"rated_quantity" integer DEFAULT 255,
	"actual_loaded_quantity" integer,
	"actual_gate_out_quantity" integer,
	"billable_quantity" integer,
	"vehicle_received_quantity" integer,
	"rate_condition" varchar(32) DEFAULT 'Standard Rock',
	"gap_position" integer DEFAULT 1,
	"round_number" integer DEFAULT 1,
	"is_special_trading_load" boolean DEFAULT false,
	"load_type" varchar(32) DEFAULT 'QUARRY_SALE',
	"loading_paid_by_quarry" boolean DEFAULT false,
	"quarry_rate" numeric(12, 2) NOT NULL,
	"quarry_amount" numeric(12, 2) NOT NULL,
	"customer_sale_rate" numeric(12, 2) NOT NULL,
	"customer_sale_amount" numeric(12, 2) NOT NULL,
	"driver_batta" numeric(12, 2) DEFAULT '0.00',
	"vehicle_trip_rent" numeric(12, 2) DEFAULT '0.00',
	"loading_charge" numeric(12, 2) DEFAULT '0.00',
	"diesel" numeric(12, 2) DEFAULT '0.00',
	"order_commission" numeric(12, 2) DEFAULT '0.00',
	"other_expense" numeric(12, 2) DEFAULT '0.00',
	"total_expense" numeric(12, 2) DEFAULT '0.00',
	"net_profit" numeric(12, 2) DEFAULT '0.00',
	"payment_received" numeric(12, 2) DEFAULT '0.00',
	"balance" numeric(12, 2) DEFAULT '0.00',
	"status" "load_status" DEFAULT 'Loaded' NOT NULL,
	"gate_pass_number" varchar(32),
	"entered_by" varchar(64) NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loads_load_number_unique" UNIQUE("load_number")
);
--> statement-breakpoint
CREATE TABLE "machine_fuel" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"machine_id" varchar(32) NOT NULL,
	"date" varchar(16) NOT NULL,
	"fuel_type" varchar(32) DEFAULT 'Diesel' NOT NULL,
	"quantity_litres" numeric(10, 2) NOT NULL,
	"rate_per_litre" numeric(10, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"vendor_shop" varchar(128),
	"bill_number" varchar(64),
	"payment_status" varchar(32) DEFAULT 'Paid',
	"entered_by" varchar(64) NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_maintenance" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"machine_id" varchar(32) NOT NULL,
	"date" varchar(16) NOT NULL,
	"maintenance_type" varchar(64) DEFAULT 'Preventive',
	"description" text NOT NULL,
	"parts_replaced" text,
	"parts_cost" numeric(12, 2) DEFAULT '0.00',
	"technician_labour_cost" numeric(12, 2) DEFAULT '0.00',
	"total_cost" numeric(12, 2) NOT NULL,
	"technician_vendor" varchar(128),
	"bill_number" varchar(64),
	"machine_hours_at_service" numeric(10, 2),
	"next_service_due_hours" numeric(10, 2),
	"entered_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_work_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"machine_id" varchar(32) NOT NULL,
	"date" varchar(16) NOT NULL,
	"operator" varchar(128) NOT NULL,
	"start_hour_reading" numeric(10, 2) NOT NULL,
	"end_hour_reading" numeric(10, 2) NOT NULL,
	"total_hours" numeric(10, 2) NOT NULL,
	"rate_per_hour" numeric(10, 2) DEFAULT '1400.00',
	"total_amount" numeric(12, 2) NOT NULL,
	"diesel_responsibility" varchar(64) DEFAULT 'Owner',
	"reimbursed_diesel_amount" numeric(12, 2) DEFAULT '0.00',
	"description" text,
	"remarks" text,
	"verified_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machinery" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"machine_id" varchar(32) NOT NULL,
	"name" varchar(128) NOT NULL,
	"type" varchar(64) NOT NULL,
	"owner" varchar(128) NOT NULL,
	"ownership" varchar(64) DEFAULT 'RZ Mining Owned',
	"model" varchar(128),
	"operator" varchar(128),
	"assistant_operator" varchar(128),
	"status" varchar(32) DEFAULT 'Active',
	"installation_date" varchar(16),
	"hour_meter" numeric(10, 2) DEFAULT '0.00',
	"replaced_by_machine_id" varchar(32),
	"replacement_date" varchar(16),
	"replacement_reason" text,
	"notes" text,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "machinery_machine_id_unique" UNIQUE("machine_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"order_id" varchar(32) NOT NULL,
	"order_date" varchar(16) NOT NULL,
	"customer_id" varchar(64),
	"customer_name" varchar(128) NOT NULL,
	"customer_phone" varchar(32),
	"delivery_location" text,
	"agent_name" varchar(128),
	"quality" varchar(64) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(16) DEFAULT 'pcs' NOT NULL,
	"rate" numeric(12, 2) NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"commission" numeric(12, 2) DEFAULT '0.00',
	"payment_terms" varchar(32) DEFAULT 'IMMEDIATE',
	"assigned_vehicle" varchar(32),
	"driver" varchar(128),
	"required_date" varchar(16),
	"remarks" text,
	"status" "order_status" DEFAULT 'NEW' NOT NULL,
	"payment_received" numeric(12, 2) DEFAULT '0.00',
	"balance" numeric(12, 2) DEFAULT '0.00',
	"entered_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"date" varchar(16) NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"customer_name" varchar(128) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_mode" varchar(32) DEFAULT 'Cash',
	"reference" varchar(128),
	"receipt_number" varchar(64),
	"remarks" text,
	"entered_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"staff_id" varchar(64) NOT NULL,
	"employee_name" varchar(128) NOT NULL,
	"role" varchar(64) NOT NULL,
	"month" varchar(16) NOT NULL,
	"basic_salary_or_daily_rate" numeric(12, 2) NOT NULL,
	"salary_type" varchar(32) DEFAULT 'Daily Wage',
	"days_present" integer DEFAULT 0,
	"half_days" integer DEFAULT 0,
	"days_absent" integer DEFAULT 0,
	"days_leave" integer DEFAULT 0,
	"overtime_hours" numeric(6, 2) DEFAULT '0.00',
	"overtime_pay" numeric(12, 2) DEFAULT '0.00',
	"regular_gross" numeric(12, 2) DEFAULT '0.00',
	"bonus" numeric(12, 2) DEFAULT '0.00',
	"gross_salary" numeric(12, 2) NOT NULL,
	"advances_deducted" numeric(12, 2) DEFAULT '0.00',
	"other_deductions" numeric(12, 2) DEFAULT '0.00',
	"food_allowance" numeric(12, 2) DEFAULT '0.00',
	"net_salary" numeric(12, 2) NOT NULL,
	"payment_status" varchar(32) DEFAULT 'Paid',
	"payment_date" varchar(16),
	"payment_mode" varchar(32) DEFAULT 'Bank Transfer',
	"reference" varchar(128),
	"generated_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"section_id" varchar(64),
	"production_id" varchar(32) NOT NULL,
	"date" varchar(16) NOT NULL,
	"start_time" varchar(16),
	"end_time" varchar(16),
	"working_hours" numeric(5, 2) DEFAULT '4.50',
	"section" varchar(64) DEFAULT 'Section A',
	"cutting_machine" varchar(128),
	"operator" varchar(128),
	"assistant_operator" varchar(128),
	"helpers" text,
	"soil_condition" varchar(128),
	"rock_strength" varchar(128),
	"moisture" varchar(64),
	"heat" varchar(64),
	"cutting_condition" text,
	"splitting_condition" text,
	"cutting_notes" text,
	"total_cut_quantity" integer NOT NULL,
	"finished_quantity" integer NOT NULL,
	"first_quality_quantity" integer DEFAULT 0,
	"second_quality_quantity" integer DEFAULT 0,
	"latt_quantity" integer DEFAULT 0,
	"mury_quantity" integer DEFAULT 0,
	"allocated_vehicle" varchar(32),
	"gap_position" integer DEFAULT 1,
	"remarks" text,
	"entered_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_production_id_unique" UNIQUE("production_id")
);
--> statement-breakpoint
CREATE TABLE "quarries" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_code" varchar(32) NOT NULL,
	"quarry_name" varchar(128) NOT NULL,
	"business_name" varchar(128) DEFAULT 'RZ Mining Ventures LLP',
	"address" text,
	"location" varchar(128),
	"phone" varchar(32),
	"email" varchar(128),
	"owner" varchar(128) DEFAULT 'RZ Ventures',
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quarries_quarry_code_unique" UNIQUE("quarry_code")
);
--> statement-breakpoint
CREATE TABLE "quarry_memberships" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"role" "user_role" DEFAULT 'VIEWER' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quarry_sections" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"section_code" varchar(16) NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rates" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"section_id" varchar(64),
	"effective_date" varchar(16) NOT NULL,
	"rates_data" jsonb NOT NULL,
	"updated_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rotations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"rotation_date" varchar(16) NOT NULL,
	"rotation_number" integer DEFAULT 1,
	"entries" jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'Active',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"employee_id" varchar(32) NOT NULL,
	"name" varchar(128) NOT NULL,
	"role" varchar(64) NOT NULL,
	"phone" varchar(32),
	"daily_wage" numeric(12, 2) DEFAULT '1600.00',
	"basic_salary" numeric(12, 2) DEFAULT '0.00',
	"salary_type" varchar(32) DEFAULT 'Daily Wage',
	"active" boolean DEFAULT true NOT NULL,
	"join_date" varchar(16),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "statements" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64) NOT NULL,
	"invoice_number" varchar(64) NOT NULL,
	"date" varchar(16) NOT NULL,
	"client_code" varchar(32),
	"customer_id" varchar(64),
	"customer_name" varchar(128) NOT NULL,
	"owner_name" varchar(128),
	"driver_name" varchar(128),
	"phone_number" varchar(32),
	"vehicle_number" varchar(32),
	"from_date" varchar(16) NOT NULL,
	"to_date" varchar(16) NOT NULL,
	"material_filter" varchar(64) DEFAULT 'All',
	"total_quantity" integer DEFAULT 0,
	"total_loads" integer DEFAULT 0,
	"grand_total" numeric(12, 2) NOT NULL,
	"amount_in_words" text,
	"quality_summary" jsonb,
	"generated_by" varchar(64) NOT NULL,
	"generated_at" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "statements_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(128) NOT NULL,
	"name" varchar(128) NOT NULL,
	"phone" varchar(32),
	"avatar_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_transactions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"vehicle_id" varchar(64),
	"vehicle_number" varchar(32) NOT NULL,
	"date" varchar(16) NOT NULL,
	"type" varchar(32) NOT NULL,
	"category" varchar(64) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"trip_id" varchar(64),
	"driver_id" varchar(64),
	"payment_mode" varchar(32) DEFAULT 'Cash',
	"reference" varchar(128),
	"entered_by" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"quarry_id" varchar(64),
	"vehicle_number" varchar(32) NOT NULL,
	"owner" varchar(128) NOT NULL,
	"driver" varchar(128) NOT NULL,
	"phone" varchar(32),
	"category" varchar(64) DEFAULT 'Outside Vehicle' NOT NULL,
	"owner_type" varchar(32) DEFAULT 'OUTSIDE' NOT NULL,
	"trip_rent" numeric(12, 2) DEFAULT '700.00',
	"capacity" integer DEFAULT 260,
	"status" varchar(32) DEFAULT 'Active',
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_vehicle_number_unique" UNIQUE("vehicle_number")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_collections" ADD CONSTRAINT "driver_collections_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_load_id_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "land_owner_payments" ADD CONSTRAINT "land_owner_payments_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "land_owner_payments" ADD CONSTRAINT "land_owner_payments_land_owner_id_land_owners_id_fk" FOREIGN KEY ("land_owner_id") REFERENCES "public"."land_owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "land_owners" ADD CONSTRAINT "land_owners_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_ledger_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ledger_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loads" ADD CONSTRAINT "loads_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_fuel" ADD CONSTRAINT "machine_fuel_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_maintenance" ADD CONSTRAINT "machine_maintenance_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_work_logs" ADD CONSTRAINT "machine_work_logs_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production" ADD CONSTRAINT "production_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarry_memberships" ADD CONSTRAINT "quarry_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarry_memberships" ADD CONSTRAINT "quarry_memberships_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quarry_sections" ADD CONSTRAINT "quarry_sections_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rates" ADD CONSTRAINT "rates_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rotations" ADD CONSTRAINT "rotations_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_transactions" ADD CONSTRAINT "vehicle_transactions_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_quarry_id_quarries_id_fk" FOREIGN KEY ("quarry_id") REFERENCES "public"."quarries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_quarry_idx" ON "audit_logs" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "customers_quarry_idx" ON "customers" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "driver_collections_quarry_idx" ON "driver_collections" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "drivers_quarry_idx" ON "drivers" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "expenses_quarry_idx" ON "expenses" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "expenses_machine_idx" ON "expenses" USING btree ("machine_id");--> statement-breakpoint
CREATE INDEX "gate_passes_quarry_idx" ON "gate_passes" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "gate_passes_date_idx" ON "gate_passes" USING btree ("date");--> statement-breakpoint
CREATE INDEX "income_quarry_idx" ON "income" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "income_date_idx" ON "income" USING btree ("date");--> statement-breakpoint
CREATE INDEX "lpay_quarry_idx" ON "land_owner_payments" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "lpay_owner_idx" ON "land_owner_payments" USING btree ("land_owner_id");--> statement-breakpoint
CREATE INDEX "land_owners_quarry_idx" ON "land_owners" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_quarry_idx" ON "ledger_entries" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_tx_idx" ON "ledger_entries" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_account_idx" ON "ledger_entries" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX "ledger_tx_quarry_idx" ON "ledger_transactions" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "ledger_tx_date_idx" ON "ledger_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "ledger_tx_ref_idx" ON "ledger_transactions" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "loads_quarry_idx" ON "loads" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "loads_date_idx" ON "loads" USING btree ("date");--> statement-breakpoint
CREATE INDEX "loads_vehicle_idx" ON "loads" USING btree ("vehicle_number");--> statement-breakpoint
CREATE INDEX "mfuel_quarry_idx" ON "machine_fuel" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "mfuel_machine_idx" ON "machine_fuel" USING btree ("machine_id");--> statement-breakpoint
CREATE INDEX "mmaint_quarry_idx" ON "machine_maintenance" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "mmaint_machine_idx" ON "machine_maintenance" USING btree ("machine_id");--> statement-breakpoint
CREATE INDEX "mwork_quarry_idx" ON "machine_work_logs" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "mwork_machine_idx" ON "machine_work_logs" USING btree ("machine_id");--> statement-breakpoint
CREATE INDEX "machinery_quarry_idx" ON "machinery" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "orders_quarry_idx" ON "orders" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "orders_date_idx" ON "orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_quarry_idx" ON "payments" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "payments_customer_idx" ON "payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payroll_quarry_idx" ON "payroll" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "payroll_month_idx" ON "payroll" USING btree ("month");--> statement-breakpoint
CREATE INDEX "production_quarry_idx" ON "production" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "production_date_idx" ON "production" USING btree ("date");--> statement-breakpoint
CREATE INDEX "membership_user_idx" ON "quarry_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_quarry_idx" ON "quarry_memberships" USING btree ("quarry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_user_quarry_idx" ON "quarry_memberships" USING btree ("user_id","quarry_id");--> statement-breakpoint
CREATE INDEX "quarry_sections_quarry_idx" ON "quarry_sections" USING btree ("quarry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quarry_section_unique_idx" ON "quarry_sections" USING btree ("quarry_id","section_code");--> statement-breakpoint
CREATE INDEX "rates_quarry_idx" ON "rates" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "rotations_quarry_idx" ON "rotations" USING btree ("quarry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rotations_date_unique_idx" ON "rotations" USING btree ("quarry_id","rotation_date");--> statement-breakpoint
CREATE INDEX "staff_quarry_idx" ON "staff" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "statements_quarry_idx" ON "statements" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "statements_customer_idx" ON "statements" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "vtx_quarry_idx" ON "vehicle_transactions" USING btree ("quarry_id");--> statement-breakpoint
CREATE INDEX "vtx_vehicle_idx" ON "vehicle_transactions" USING btree ("vehicle_number");--> statement-breakpoint
CREATE INDEX "vehicles_quarry_idx" ON "vehicles" USING btree ("quarry_id");