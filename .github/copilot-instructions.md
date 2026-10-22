# RZ MINETRIX — AI coding and audit instructions

## Mission
Make small, reviewable, verifiable changes to the existing RZ MINETRIX quarry ERP. Treat the repository as a business-critical multi-tenant application.

## Non-negotiable project constraints
- Do not add a tenth primary platform/module. Preserve the established nine-platform scope.
- Preserve RZ MINETRIX and PNK brand assets, design direction, existing user workflows, and business rules unless the task explicitly requests a change.
- Never invent quarry records, invoice entries, accounting values, credentials, secrets, or test results.
- Never commit environment files, service-account JSON, private keys, tokens, customer personal data, or production database exports.
- Do not deploy, merge to the default branch, run destructive migrations, or reset/import production data without explicit human approval.
- Prefer a dedicated feature branch and pull request over direct changes to the default branch.

## Required implementation loop
1. Inspect the repository, current branch, related files, package scripts, migrations, and existing tests before editing.
2. Write down the specific findings and a minimal implementation plan.
3. Implement the smallest complete fix; preserve backward compatibility where practical.
4. Run available checks: dependency install, typecheck/lint, build, unit/integration tests, and migration validation where applicable.
5. If a check fails, identify the actual cause, fix it, and rerun the relevant checks. Do not claim success if checks were not run or still fail.
6. Review the diff for regressions, secrets, unsafe data access, and unrelated changes.
7. Report changed files, commit/PR references, exact checks run, pass/fail results, remaining risks, and any required human actions.

## Security and data-isolation audit
- Verify Firebase ID tokens on the server; never trust client-supplied user IDs or roles.
- Enforce role authorization and quarry/tenant membership on every protected route and every record read/write, not just dashboard/state endpoints.
- Deny access by default. Test cross-quarry reads and writes explicitly.
- Validate request bodies and query parameters; avoid leaking stack traces, tokens, or private data.
- Keep audit trails for sensitive changes. Treat financial, payroll, identity, and quarry data as sensitive.
- Do not run database migrations against a live environment in CI. Use a disposable test database or a reviewed migration check.
- Document any endpoint or table whose access-control behavior has not been verified.

## Required report format
- Status: PASS / FAIL / BLOCKED / NOT VERIFIED
- Findings grouped by Critical / High / Medium / Low
- Evidence: file path, route/function, and test/check output
- Changes made and commit/PR reference
- Checks actually run, including skipped checks and why
- Remaining risks and next actions

A green build is not a security certification. Never mark production-ready solely because lint and build pass.
