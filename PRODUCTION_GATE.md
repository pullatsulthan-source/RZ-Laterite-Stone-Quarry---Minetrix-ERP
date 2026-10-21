# RZ MINETRIX Production Gate

## Required before production approval

- Firebase Admin authentication is mandatory for protected API routes.
- Quarry authorization is derived server-side from authenticated memberships.
- PostgreSQL is the production source of truth; local JSON is never a production fallback.
- Privileged mutations must be audited.
- Financial mutations must be atomic and rollback-safe.
- CI must pass install, lint/typecheck, tests, production build and Docker build.
- Production bootstrap must use approved production data; demo JSON must not be imported automatically.

## Verification matrix

| Gate | Required result |
|---|---|
| Firebase authentication | PASS |
| RBAC | PASS |
| Quarry isolation | PASS |
| PostgreSQL persistence | PASS |
| Audit logging | PASS |
| Financial transaction integrity | PASS |
| Automated tests | PASS |
| Docker build | PASS |
| CI | PASS |
| Cloud Run smoke test | PASS |
| Backup/restore | PASS |

A gate is not considered complete merely because the code exists. It must have an executable test or a verified production check where applicable.
