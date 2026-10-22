import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required. No migrations were run.');
  process.exit(1);
}

const migrationsDir = path.resolve(process.cwd(), 'drizzle');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();

if (migrationFiles.length === 0) {
  console.error('No numbered SQL migrations found.');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 });
try {
  await pool.query(`CREATE TABLE IF NOT EXISTS rz_schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  for (const name of migrationFiles) {
    const prior = await pool.query('SELECT name FROM rz_schema_migrations WHERE name = $1', [name]);
    if (prior.rowCount) {
      console.log(`skip ${name} (already recorded)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO rz_schema_migrations (name) VALUES ($1)', [name]);
      await pool.query('COMMIT');
      console.log(`applied ${name}`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw new Error(`Migration ${name} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  await pool.query('SELECT id FROM app_state LIMIT 0');
  console.log(`Verified ${migrationFiles.length} migration file(s); app_state table is available.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Migration failed.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
