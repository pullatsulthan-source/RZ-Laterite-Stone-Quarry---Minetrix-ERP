import { pool } from './connection';

export type AppState = Record<string, unknown>;

export async function readAppState(): Promise<AppState | null> {
  const result = await pool.query<{ state: AppState }>(
    "SELECT state FROM app_state WHERE id = $1 LIMIT 1",
    ['default'],
  );
  return result.rows[0]?.state ?? null;
}

export async function writeAppState(state: AppState): Promise<void> {
  await pool.query(
    `INSERT INTO app_state (id, state, version, updated_at)
     VALUES ($1, $2::jsonb, 1, now())
     ON CONFLICT (id) DO UPDATE
       SET state = EXCLUDED.state,
           version = app_state.version + 1,
           updated_at = now()`,
    ['default', JSON.stringify(state)],
  );
}

export async function verifyAppStateTable(): Promise<void> {
  await pool.query('SELECT id FROM app_state LIMIT 0');
}
