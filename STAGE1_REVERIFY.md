# Stage 1 CI Reverification

This workflow intentionally runs independently on `fix/stage1-ci-production-gate` so the closed/merged PR cannot hide the verification result.

Gate: install dependencies, typecheck, tests, production build, and Docker build.
