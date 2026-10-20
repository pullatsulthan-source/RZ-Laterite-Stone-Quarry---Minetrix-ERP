# RZ MINETRIX Security and Verification Status

**Status: INCOMPLETE — NOT APPROVED FOR PRODUCTION**

This document records known verification gaps from the current authentication/database foundation work. It is not a penetration test or security certification. Update it only when evidence and tests support a status change.

## Findings

### High — Per-quarry authorization is not verified across all API routes
- Evidence: The legacy `/api` isolation middleware filters mapped collection reads and checks quarry membership on mapped mutations and item access. `canAccessQuarry` normalizes role case; nested payroll rows are validated individually; active-quarry selection is user-scoped; global rates are administrator-only until per-quarry storage exists. Non-admin requests to unmapped API resources are now denied by default except a short allowlist of endpoints with separate guards. Unit tests cover the quarry-scope helper.
- Risk: Full route-level integration coverage remains absent; legacy records without quarry ownership metadata are hidden from scoped users, and nested cross-quarry foreign-key/reference validation has not been proven.
- Required action: Add route-level integration tests for cross-quarry reads/writes and unknown/legacy records; validate referenced entities belong to the same permitted quarry; verify every API handler.
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
- Evidence: The prior CI baseline passed on commit `abf392457739f99a6cf3ffa0624835da99e3f035`. Quarry-scope helper tests were added and default-deny behavior was tightened through commit `b2d60a1f770cecf628e2453687c433b919fb1185`. GitHub Actions run `39460358746` and CodeQL run `39460358752` for that commit were not complete at last inspection.
- Required action: Confirm the latest CI and CodeQL runs complete successfully; add route-level security integration tests.
- Status: PRIOR CI BASELINE PASSING; LATEST RUNS PENDING; SECURITY AND PRODUCTION READINESS NOT VERIFIED.

## Verification policy
- A green lint/build result is not proof of authorization correctness or production readiness.
- Never claim a check passed unless a completed CI run or reproducible local output supports it.
- Do not run production migrations, deploy, or merge high-risk changes without human review.
- Keep real credentials, Firebase private keys, and production data out of source control.
