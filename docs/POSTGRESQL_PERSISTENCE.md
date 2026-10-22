# PostgreSQL Persistence Setup

## Current implementation status

The legacy API can persist its complete state snapshot to PostgreSQL in the `app_state` JSONB table. This is a compatibility bridge that preserves existing API/module behavior while entity-specific Drizzle repositories are built. It is **not** the final normalized relational cutover and is **not approved for multi-instance production**: multiple server processes can overwrite concurrent state changes.

The source `data/quarry_db.json` is retained. The import command refuses to overwrite an existing `app_state/default` record.

## Configure

1. Provision a PostgreSQL database and set `DATABASE_URL` in the runtime environment. Do not commit credentials.
2. Set `DB_ADAPTER=postgres`. The server defaults to PostgreSQL; local JSON must be selected explicitly with `DB_ADAPTER=local-json` and is rejected in production.
3. Run migrations in the target environment:

   ```bash
   npm run migrate
   ```

4. Import the existing JSON database once:

   ```bash
   npm run db:seed
   ```

   `db:seed` runs the tracked SQL migrations and then imports `data/quarry_db.json`. It fails if the destination already has a default state row. Keep a separate backup of the source file and PostgreSQL before attempting migration.
5. Start the application with `DB_ADAPTER=postgres`. Startup checks that the table exists and that a default state row can be loaded; it will not silently initialize an empty PostgreSQL database from seed defaults.

## Verification checklist

Run `npm run lint`, `npm run build`, and `npm test`. Then use a non-production PostgreSQL database to verify:

- migrations 0001–0003 are recorded in `rz_schema_migrations`;
- the JSON import reports `status: verified` and expected collection counts;
- create/read/update/delete operations survive a server restart;
- an existing destination row causes import to stop without modifying it;
- tenant A cannot read or mutate tenant B's data through any API route.

The PostgreSQL runtime migration is not considered complete until those live database checks pass. Before multi-instance production use, migrate each business module to tenant-filtered relational repositories and enforce tenant isolation with database-level RLS.
