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
    throw new Error("No app_state/default record exists. Initialize the database deliberately before deploying; do not import demo data into production.");
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
    throw new Error('No quarry is configured in app_state/default. Configure an initial quarry before production deployment.');
  }
  if (!state.branding || !state.billingConfig || !state.rates) {
    throw new Error('Required branding, billing configuration, or rates are missing from app_state/default.');
  }
  console.log(JSON.stringify({
    status: 'verified',
    version: Number(result.rows[0].version),
    quarryCount: state.quarries.length,
    collectionCount: requiredCollections.length,
    message: 'Database bootstrap structure verified; this does not replace tenant-isolation or CRUD integration tests.',
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Production bootstrap check failed.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
