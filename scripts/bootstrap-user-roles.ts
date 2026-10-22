#!/usr/bin/env node
/**
 * Idempotently assigns the two configured bootstrap roles after Firebase UIDs
 * have been verified. It never deletes rows or changes other users' roles.
 */
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const url = process.env.DATABASE_URL;
if (!url || !/^postgres(?:ql)?:\/\//i.test(url)) {
  console.error('[user bootstrap] DATABASE_URL must point to PostgreSQL.');
  process.exit(1);
}
const ownerUid = process.env.BOOTSTRAP_OWNER_UID?.trim() || '';
const adminUid = process.env.BOOTSTRAP_ADMIN_UID?.trim() || '';
if (!ownerUid && !adminUid) {
  console.error('[user bootstrap] Set at least one verified bootstrap UID.');
  process.exit(1);
}
if (ownerUid && adminUid && ownerUid === adminUid) {
  console.error('[user bootstrap] Owner and admin UIDs must be different.');
  process.exit(1);
}
const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 10000 });

async function main() {
  for (const [uid, role] of [[ownerUid, 'OWNER'], [adminUid, 'ADMIN']] as const) {
    if (!uid) continue;
    const result = await pool.query(
      'UPDATE users SET role = $2, updated_at = now() WHERE id = $1 RETURNING id, role',
      [uid, role],
    );
    if (result.rowCount !== 1) {
      throw new Error(`User ${role} bootstrap failed: configured Firebase UID does not exist in users table. Sign in that verified allowlisted account first, then rerun.`);
    }
    console.log(`[user bootstrap] Set configured Firebase UID to ${role}; UID is not printed.`);
  }
}
main().catch((error) => {
  console.error('[user bootstrap] failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
}).finally(async () => {
  await pool.end();
});
