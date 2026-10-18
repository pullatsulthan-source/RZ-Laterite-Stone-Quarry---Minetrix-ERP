#!/usr/bin/env node
/**
 * scripts/migrate-json-to-pg.ts
 * Phase 1 placeholder: migration utility that will be implemented fully in Phase 5.
 * For now this script reads data/quarry_db.json and prints a summary of top-level keys
 * and counts to help planning the migration.
 */

import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data', 'quarry_db.json');

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('No JSON DB found at', DB_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  let db: any;
  try {
    db = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON DB:', e);
    process.exit(1);
  }

  const keys = Object.keys(db || {});
  console.log('Found top-level keys:', keys);
  keys.forEach((k) => {
    const v = db[k];
    if (Array.isArray(v)) {
      console.log(`  - ${k}: ${v.length} records`);
    } else if (v && typeof v === 'object') {
      console.log(`  - ${k}: object with keys ${Object.keys(v).join(', ')}`);
    } else {
      console.log(`  - ${k}: ${typeof v}`);
    }
  });

  console.log('\nMigration utility placeholder — full migration will be implemented in Phase 5.');
}

main();
