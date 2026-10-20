# Audit Logging — RZ MINETRIX ERP

## What is recorded

The API request audit middleware writes events to PostgreSQL `audit_logs` after each API response (except public health checks and the audit-log read endpoint). It records:
- Request ID, authenticated Firebase UID when available, HTTP method, route, status code and timestamp.
- Action and route-derived entity; route identifier when present.
- Quarry identifier only when it matches an existing quarry row.
- Sanitized mutation request body in `after_data`; `before_data` remains null because legacy handlers do not expose a consistent pre-mutation snapshot.
- Request metadata: query parameters, duration, outcome, content length, client IP and user-agent.
- Sensitive request fields with names such as password, token, authorization, secret, private key, API key, cookie and credential are redacted before persistence.

## Read the audit trail

`GET /api/audit-logs` requires a verified Firebase ID token and OWNER or ADMIN role.

Optional query parameters:
- `limit`: 1–200 (default 50)
- `offset`: non-negative integer (default 0)
- `userId`: exact Firebase UID
- `action`: partial action match
- `quarryId`: exact existing quarry ID
- `from`, `to`: valid date-time values

Example:
`GET /api/audit-logs?limit=50&action=POST:loads&from=2026-10-01T00:00:00Z`

The response includes `total`, `limit`, `offset` and newest-first `items`.

## Apply the database migration

On the target environment, with `DATABASE_URL` configured:

```bash
npm run migrate
```

Migration `drizzle/0004_audit_logging.sql` adds request metadata columns and indexes. Confirm the migration runner reports it applied, then perform a controlled API request and verify a corresponding row appears in `audit_logs`.

## Important limitations

- This is request-level audit logging, not a complete business-level before/after diff. Legacy routes must be migrated to service/repository functions that record entity snapshots in the same database transaction to provide reliable before/after evidence.
- Audit inserts are asynchronous after the HTTP response finishes. If PostgreSQL logging fails, the request is not rolled back; an operational error is emitted without logging request-body contents. Monitor these failures.
- IP addresses and user-agent strings can be personal data. Define and enforce an approved retention period, access review, and backup policy before production use.
- The audit table is not yet tamper-evident or append-only at the database permission layer. Restrict direct database write/delete privileges and consider external immutable log export before treating logs as regulatory evidence.
