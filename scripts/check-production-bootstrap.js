import process from 'node:process';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Production bootstrap check failed.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  const result = await pool.query("SELECT state, version FROM app_state WHERE id = 'default' LIMIT 1");
  if (result.rowCount !== 1) {
    throw new Error("No app_state/default record exists. Initialize the database deliberately before deploying; demo data must never be imported.");
  }
  const state = result.rows[0].state;
  const requiredCollections = [
    'vehicles', 'drivers', 'customers', 'staff', 'attendance', 'advances',
    'payrolls', 'loads', 'gatePasses', 'production', 'stockAdjustments',
    'income', 'expenses', 'payments', 'statements', 'rotations',
    'vehicleTransactions', 'orders', 'quarries', 'driverCollections',
  ];
  const missing = requiredCollections.filter((key) => !Object.hasOwn(state ?? {}, key));
  if (missing.length) {
    throw new Error(`app_state/default is missing required collections: ${missing.join(', ')}`);
  }
  if (!Array.isArray(state.quarries) || state.quarries.length === 0) {
    throw new Error('No real quarry is configured in app_state/default. Deployment is blocked until the production quarry profile is configured.');
  }
  if (!state.branding || !state.billingConfig || !state.rates || Object.keys(state.rates).length === 0) {
    throw new Error('Required branding, billing configuration, or rates are missing. Deployment is blocked until real production configuration exists.');
  }
  console.log(JSON.stringify({
    status: 'verified',
    version: Number(result.rows[0].version),
    quarryCount: state.quarries.length,
    collectionCount: requiredCollections.length,
    message: 'Production state structure verified; no row contents or sensitive values were printed.',
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Production bootstrap check failed.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
