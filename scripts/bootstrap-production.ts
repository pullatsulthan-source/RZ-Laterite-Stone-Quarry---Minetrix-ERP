#!/usr/bin/env node
/**
 * Explicitly initializes a clean production app_state only when no row exists.
 * It never overwrites existing data, imports local JSON, or seeds demo records.
 * Requires CONFIRM_EMPTY_PRODUCTION_BOOTSTRAP=YES.
 */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const url = process.env.DATABASE_URL;
if (!url || !/^postgres(?:ql)?:\/\//i.test(url)) {
  console.error('[bootstrap] DATABASE_URL must point to PostgreSQL.');
  process.exit(1);
}
if (process.env.CONFIRM_EMPTY_PRODUCTION_BOOTSTRAP !== 'YES') {
  console.error('[bootstrap] Set CONFIRM_EMPTY_PRODUCTION_BOOTSTRAP=YES only after confirming this target has no production data.');
  process.exit(1);
}
const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 10000 });

async function main() {
  await pool.query('SELECT id FROM app_state LIMIT 0');
  const existing = await pool.query('SELECT id FROM app_state WHERE id = $1', ['default']);
  if (existing.rowCount) {
    console.log('[bootstrap] Existing app_state/default preserved without changes.');
    return;
  }

  const state = {
    vehicles: [], drivers: [], customers: [], staff: [], attendance: [],
    advances: [], payrolls: [], rates: {}, loads: [], gatePasses: [],
    production: [], stockAdjustments: [], income: [], expenses: [], payments: [],
    statements: [], rotations: [], vehicleTransactions: [], orders: [],
    quarries: [], activeQuarryId: '', branding: {}, billingConfig: {},
    theme: 'rz_gold', driverCollections: [],
  };
  await pool.query(
    'INSERT INTO app_state (id, state, version, updated_at) VALUES ($1, $2::jsonb, 1, now())',
    ['default', JSON.stringify(state)],
  );
  console.log('[bootstrap] Created clean, empty app_state/default; no demo records were imported.');
  console.log('[bootstrap] Production remains in setup mode until the real quarry profile, rates, branding and billing configuration are entered.');
}
main().catch((error) => {
  console.error('[bootstrap] failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
}).finally(async () => {
  await pool.end();
});
