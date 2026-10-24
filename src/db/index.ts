import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/rz_minetrix';

export const isDatabaseConfigured = (): boolean => {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.startsWith('postgres') &&
    process.env.DB_ADAPTER !== 'local-json'
  );
};

// Create the connection pool
export const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', () => {
  // Suppress unhandled pool error events from uncaught listeners in local dev
});


// Initialize Drizzle ORM instance with full schema
export const db = drizzle(pool, { schema });

export { schema };
export default db;
