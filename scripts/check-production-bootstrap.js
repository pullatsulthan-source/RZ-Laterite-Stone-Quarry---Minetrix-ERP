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
  if (missing.length) throw new Error(`app_state/default is missing required collections: ${missing.join(', ')}`);

  const quarryCount = Array.isArray(state.quarries) ? state.quarries.length : 0;
  const hasRealConfig =
    quarryCount > 0 &&
    Boolean(state.branding) &&
    Boolean(state.billingConfig) &&
    Boolean(state.rates && Object.keys(state.rates).length > 0);

  if (!hasRealConfig) {
    // A clean first deployment can serve the Google-login shell but must stay in setup mode.
    // Do not deploy on the false assumption that operational ERP setup is complete.
    console.log(JSON.stringify({
      status: 'SETUP_REQUIRED',
      version: Number(result.rows[0].version),
      quarryCount,
      collectionCount: requiredCollections.length,
      demoDataImported: false,
      message: 'No demo data was imported. Add the real quarry profile, rates, branding and billing configuration before using ERP operations.',
    }));
  } else {
    console.log(JSON.stringify({
      status: 'verified',
      version: Number(result.rows[0].version),
      quarryCount,
      collectionCount: requiredCollections.length,
      demoDataImported: false,
      message: 'Production state structure verified; row contents were not printed.',
    }));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Production bootstrap check failed.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
