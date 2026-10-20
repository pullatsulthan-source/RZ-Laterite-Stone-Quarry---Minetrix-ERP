# RZ MINETRIX Security and Verification Status

**Status: INCOMPLETE — NOT APPROVED FOR PRODUCTION**

This document records known verification gaps from the current authentication/database foundation work. It is not a penetration test or security certification. Update it only when evidence and tests support a status change.

## Findings

### High — Per-quarry authorization is not verified across all API routes
- Evidence: The legacy `/api` isolation middleware filters mapped collection reads and checks quarry membership on mapped mutations and item access. `canAccessQuarry` now normalizes role case; nested payroll rows are stamped/validated individually; active-quarry selection is held per user instead of mutating the shared database field; global rates remain administrator-only until per-quarry storage exists. Unit tests cover the quarry-scope helper. Full route-level integration coverage is still absent.
- Risk: A route/resource not covered by the mapping, legacy rows without quarry ownership metadata, or nested response/data paths could still be incorrectly handled.
- Required action: Add route-level integration tests for cross-quarry reads/writes and unknown/legacy records; verify all API handlers and nested resources. Keep unverified routes fail-closed.
- Status: IMPROVED / PARTIALLY IMPLEMENTED / NOT VERIFIED.

### High — Frontend Firebase token integration is not verified
- Evidence: The server expects a Bearer token for protected `/api` endpoints. The frontend's complete sign-in, token refresh, and authenticated API request flow has not been validated end to end.
- Risk: Legitimate frontend requests may fail with 401 responses, or authentication behavior may differ between screens.
- Required action: Integrate Firebase client auth, attach fresh ID tokens to API requests, and add end-to-end tests.
- Status: OPEN / NOT VERIFIED.

### High — Runtime persistence is not proven to use PostgreSQL
- Evidence: `server.ts` still loads and saves `data/quarry_db.json`. The Drizzle schema and migration foundation do not prove the legacy API has been migrated to PostgreSQL.
- Risk: Data persistence, multi-instance consistency, backup, and tenant isolation assumptions may be incorrect.
- Required action: Define and execute a reviewed migration plan in a non-production environment; verify every required data path before cutover.
- Status: OPEN / NOT VERIFIED.

### Medium — Audit logging service is not verified
- Evidence: An `audit_logs` schema table exists, but a complete service that records and protects sensitive business changes has not been verified.
- Risk: Sensitive changes may not have a reliable audit trail.
- Required action: Implement append-only audit events for sensitive actions and tests for coverage and access control.
- Status: OPEN / NOT VERIFIED.

### Medium — Build and test baseline
- Evidence: The prior CI baseline passed on commit `abf392457739f99a6cf3ffa0624835da99e3f035`. New quarry-scope helper tests were added in commit `638a9afdf7bf78ecc4cb53ddfd1f7c4e138356ed`; its GitHub Actions run `39460248111` was pending at last inspection.
- Required action: Confirm the latest CI run completes successfully; add route-level security integration tests.
- Status: PRIOR CI BASELINE PASSING; LATEST RUN PENDING; SECURITY AND PRODUCTION READINESS NOT VERIFIED.

## Verification policy
- A green lint/build result is not proof of authorization correctness or production readiness.
- Never claim a check passed unless a completed CI run or reproducible local output supports it.
- Do not run production migrations, deploy, or merge high-risk changes without human review.
- Keep real credentials, Firebase private keys, and production data out of source control.
