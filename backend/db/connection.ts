import pkg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

export const isPostgresConfigured = (): boolean => {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.startsWith('postgres') &&
    process.env.DB_ADAPTER !== 'local-json'
  );
};

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/rz_minetrix',
  connectionTimeoutMillis: 1500,
  idleTimeoutMillis: 10000,
});

pool.on('error', () => {
  // Suppress unhandled pool error events from uncaught listeners
});

let postgresReachable: boolean | null = null;
let lastCheckTime = 0;

export async function isPostgresAvailable(): Promise<boolean> {
  if (!isPostgresConfigured()) return false;
  const now = Date.now();
  if (postgresReachable !== null && now - lastCheckTime < 15000) {
    return postgresReachable;
  }
  try {
    const client = await pool.connect();
    client.release();
    postgresReachable = true;
    lastCheckTime = now;
    return true;
  } catch {
    postgresReachable = false;
    lastCheckTime = now;
    return false;
  }
}

export function markPostgresDisconnected(): void {
  postgresReachable = false;
  lastCheckTime = Date.now();
}

export const db = drizzle(pool);

