#!/usr/bin/env node
/**
 * Creates a clean, empty ERP compatibility state row only after migrations.
 * This deliberately does NOT import or seed demo/test quarry data.
 * Set CONFIRM_EMPTY_PRODUCTION_BOOTSTRAP=YES to create the initial blank state.
 */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const url = process.env.DATABASE_URL;
if (!url || !url.startsWith('postgres')) {
  console.error('[bootstrap] DATABASE_URL must point to PostgreSQL.');
  process.exit(1);
}
if (process.env.CONFIRM_EMPTY_PRODUCTION_BOOTSTRAP !== 'YES') {
  console.error('[bootstrap] Refusing to create empty production state. Set CONFIRM_EMPTY_PRODUCTION_BOOTSTRAP=YES after reviewing the target database.');
  process.exit(1);
}
const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 10000 });

async function main() {
  await pool.query('SELECT id FROM app_state LIMIT 0');
  const state = {
    vehicles: [], drivers: [], customers: [], staff: [], attendance: [],
    advances: [], payrolls: [], rates: {}, loads: [], gatePasses: [],
    production: [], stockAdjustments: [], income: [], expenses: [], payments: [],
    statements: [], rotations: [], vehicleTransactions: [], orders: [], quarries: [],
    activeQuarryId: '', branding: {}, billingConfig: {}, theme: 'rz_gold',
    driverCollections: [],
  };
  const result = await pool.query('SELECT id FROM app_state WHERE id = $1', ['default']);
  if (result.rows.length) {
    console.log('[bootstrap] app_state/default already exists; it was not changed.');
    return;
  }
  await pool.query(
    'INSERT INTO app_state (id, state, version, updated_at) VALUES ($1, $2::jsonb, 1, now())',
    ['default', JSON.stringify(state)],
  );
  console.log('[bootstrap] Created a clean empty app_state/default row. No demo data was imported.');
}
main().catch((error) => {
  console.error('[bootstrap] failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
}).finally(async () => {
  await pool.end();
});
