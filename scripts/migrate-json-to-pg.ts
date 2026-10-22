#!/usr/bin/env node
/**
 * JSON migration preflight. This repository currently has two overlapping schema
 * definitions. Never write legacy records into a possibly incompatible schema.
 * The script validates the source data and refuses to claim a successful import
 * until a dedicated, schema-reconciled migrator is implemented.
 */
import fs from 'node:fs';
import path from 'node:path';
import { isDatabaseConfigured } from '../src/db/index.ts';

const sourcePath = path.resolve(process.cwd(), 'data', 'quarry_db.json');

async function main() {
  if (!fs.existsSync(sourcePath)) throw new Error(`Source JSON file not found: ${sourcePath}`);
  const parsed: unknown = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Source data must be a JSON object.');
  }
  const data = parsed as Record<string, unknown>;
  const collectionNames = [
    'quarries', 'vehicles', 'drivers', 'customers', 'staff', 'orders',
    'loads', 'gatePasses', 'production', 'expenses', 'payments', 'income',
  ];
  const summary = collectionNames.map((name) => {
    const value = data[name];
    if (value != null && !Array.isArray(value)) throw new Error(`Expected ${name} to be an array.`);
    return { collection: name, records: Array.isArray(value) ? value.length : 0 };
  });
  console.table(summary);

  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured. This is only a preflight, not a successful migration.');
  }
  throw new Error(
    'Migration safely stopped: the active backend/db schema and src/db schema are not reconciled. ' +
    'No records were written. Implement and verify a single-schema migrator before production cutover.'
  );
}

main().catch((error) => {
  console.error('[migration preflight]', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
});
