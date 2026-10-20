# RZ MINETRIX Security and Verification Status

**Status: INCOMPLETE — NOT APPROVED FOR PRODUCTION**

This document records known verification gaps from the current authentication/database foundation work. It is not a penetration test or security certification. Update it only when evidence and tests support a status change.

## Findings

### High — Per-quarry authorization is not verified across all API routes
- Evidence: `server.ts` now has a legacy `/api` isolation middleware that filters selected collection reads and checks quarry membership for selected mutations and item reads. This middleware has not yet been covered by route-level integration tests, and not every handler/resource path has been proven isolated.
- Risk: A signed-in user could potentially reach data belonging to another quarry through a route that is not covered correctly, or through legacy records without quarry ownership metadata.
- Required action: Inventory all `/api` routes; add route/resource-level authorization tests for cross-quarry reads and writes, including legacy records and nested routes. Deny access by default.
- Status: PARTIALLY IMPLEMENTED / NOT VERIFIED.

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
- Evidence: GitHub Actions run `39459572405` for commit `abf392457739f99a6cf3ffa0624835da99e3f035` completed successfully. Dependency installation, TypeScript check, production build, test step, and artifact upload all reported success. CodeQL analysis completed its analysis step successfully in the paired run; workflow cleanup was still in progress at last inspection.
- Required action: Keep CI green for subsequent changes and add route-level security integration tests.
- Status: CI BASELINE PASSING; SECURITY AND PRODUCTION READINESS NOT VERIFIED.

## Verification policy
- A green lint/build result is not proof of authorization correctness or production readiness.
- Never claim a check passed unless a completed CI run or reproducible local output supports it.
- Do not run production migrations, deploy, or merge high-risk changes without human review.
- Keep real credentials, Firebase private keys, and production data out of source control.
