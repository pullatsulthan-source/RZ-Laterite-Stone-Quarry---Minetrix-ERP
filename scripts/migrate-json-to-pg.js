import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required. No data was changed.');
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), process.argv[2] || 'data/quarry_db.json');
if (!fs.existsSync(inputPath)) {
  console.error(`Source JSON file not found: ${inputPath}. No data was changed.`);
  process.exit(1);
}

let state;
try {
  state = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (error) {
  console.error('Source JSON is invalid. No data was changed.');
  process.exit(1);
}

if (!state || typeof state !== 'object' || Array.isArray(state) || !Array.isArray(state.loads) || !Array.isArray(state.vehicles)) {
  console.error('Source JSON does not match the expected quarry database structure. No data was changed.');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 });
try {
  await pool.query('BEGIN');
  const existing = await pool.query("SELECT version FROM app_state WHERE id = 'default' FOR UPDATE");
  if (existing.rowCount > 0) {
    throw new Error('PostgreSQL app_state already contains a default record. Refusing to overwrite existing database data.');
  }

  await pool.query(
    "INSERT INTO app_state (id, state, version, updated_at) VALUES ('default', $1::jsonb, 1, now())",
    [JSON.stringify(state)],
  );
  const verified = await pool.query(
    "SELECT state, version FROM app_state WHERE id = 'default'",
  );
  if (verified.rowCount !== 1 || JSON.stringify(verified.rows[0].state) !== JSON.stringify(state)) {
    throw new Error('Read-back verification failed; migration will be rolled back.');
  }
  await pool.query('COMMIT');
  console.log(JSON.stringify({
    status: 'verified',
    source: inputPath,
    destination: 'PostgreSQL app_state/default',
    version: Number(verified.rows[0].version),
    counts: Object.fromEntries(Object.entries(state).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])),
    message: 'Source JSON was not deleted or modified.',
  }, null, 2));
} catch (error) {
  await pool.query('ROLLBACK').catch(() => undefined);
  console.error(`Migration failed: ${error instanceof Error ? error.message : 'unknown error'}. PostgreSQL transaction rolled back.`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
