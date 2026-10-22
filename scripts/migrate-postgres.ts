#!/usr/bin/env node
/**
 * Idempotent SQL migration runner for checked-in drizzle/*.sql files.
 * Requires DATABASE_URL; never falls back to a local or demo database.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  console.error('[migrate] DATABASE_URL must point to PostgreSQL.');
  process.exit(1);
}
const migrationsDir = path.resolve(process.cwd(), 'drizzle');
const pool = new Pool({ connectionString: databaseUrl, max: 2, connectionTimeoutMillis: 10000 });

async function main() {
  if (!fs.existsSync(migrationsDir)) throw new Error(`Migrations directory missing: ${migrationsDir}`);
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => /^\d+.*\.sql$/i.test(file))
    .sort((a, b) => a.localeCompare(b, 'en'));
  if (files.length === 0) throw new Error('No SQL migrations found.');
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  for (const filename of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');
    const prior = await pool.query('SELECT checksum FROM schema_migrations WHERE name = $1', [filename]);
    if (prior.rows.length) {
      if (prior.rows[0].checksum !== checksum) {
        throw new Error(`Migration ${filename} was modified after it was applied. Add a new migration instead.`);
      }
      console.log(`[migrate] already applied: ${filename}`);
      continue;
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [filename, checksum]);
      await client.query('COMMIT');
      console.log(`[migrate] applied: ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
main().catch((error) => {
  console.error('[migrate] failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
}).finally(async () => {
  await pool.end();
});
