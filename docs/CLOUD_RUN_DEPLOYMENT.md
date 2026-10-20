# Cloud Run deployment runbook

## What this pipeline does

The manually triggered GitHub Actions workflow builds an immutable container, applies numbered SQL migrations, verifies that a real quarry and the required ERP state are present, then deploys the service to Google Cloud Run. It deliberately refuses to deploy an empty/uninitialized database. It does not import the repository's demo JSON into production.

The current state adapter stores the ERP snapshot in one PostgreSQL JSONB row. The deployment is deliberately constrained to one Cloud Run instance and request concurrency 1 as a risk-reduction measure, not as a substitute for normalized per-entity persistence and database-enforced tenant isolation. Do not scale this service horizontally until those items and cross-quarry integration tests are completed.

## One-time Google Cloud setup

1. Choose the correct Google Cloud project and region. Enable billing.
2. Create a Cloud SQL PostgreSQL instance and database. Set the instance's authorized connection method for Cloud Run.
3. Create a Secret Manager secret named `rz-minetrix-database-url`. Its value must be a PostgreSQL URL using the Cloud SQL Unix socket, for example:
   `postgresql://DB_USER:URL_ENCODED_PASSWORD@/DB_NAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME`
   URL-encode reserved characters in the password.
4. Create Secret Manager secrets named `rz-minetrix-firebase-client-email` and `rz-minetrix-firebase-private-key`. Store the service-account email and the full private key; do not commit these values. Also confirm Firebase Authentication / Google sign-in is enabled and the deployed domain is an authorized domain in Firebase Authentication.
5. Configure Workload Identity Federation between this GitHub repository and Google Cloud. Restrict the provider condition to this repository and the intended deployment branch/environment. Grant the deploy service account only the roles it needs: Cloud Run admin/developer as required, Cloud Build build submitter, Artifact Registry writer, Cloud SQL client, and Secret Manager secret accessor. Configure the Cloud Build service account's Artifact Registry write access as needed.
6. Ensure the deploy service account can read the three secrets and connect to the Cloud SQL instance.
7. Initialize the production database deliberately. Run the numbered migrations, then populate `app_state/default` from an approved initial ERP state with at least one correctly configured quarry, all required collections, rates, branding, and billing configuration. **Do not use `npm run db:seed` against production unless you explicitly intend to import the demo JSON.** The workflow's bootstrap check will stop deployment if this is missing.
8. In GitHub repository Settings → Environments, create `production`. Add these **Variables**:
   - `GCP_PROJECT_ID`, `GCP_REGION`, `CLOUD_SQL_INSTANCE` (format: `project:region:instance`)
   - `FIREBASE_PROJECT_ID`, `BOOTSTRAP_OWNER_UID` (the Firebase UID that must be provisioned as the initial OWNER for first deployment), `OWNER_BOOTSTRAP_COMPLETED` (set to `false` or leave unset for initial bootstrap)
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
9. Add these **Environment secrets**:
   - `GCP_WORKLOAD_IDENTITY_PROVIDER` (full provider resource name)
   - `GCP_SERVICE_ACCOUNT` (service account email used by the workflow and Cloud Run)
10. Make sure the GitHub Actions workflow has permission to use the production environment. Build-time `VITE_*` values are browser-visible Firebase configuration, not server credentials. Never put Firebase Admin private keys or database credentials in `VITE_*` variables.

## Deploy

1. Open the repository's Actions tab.
2. Select **Deploy RZ MINETRIX to Cloud Run** → **Run workflow**.
3. Select the intended branch/commit and start the workflow.
4. Confirm all jobs succeed and inspect the Cloud Run URL. The health check is public at `/api/health`; all ERP API endpoints except health require a verified Firebase ID token.

The first OWNER account is bootstrapped only when its UID matches `BOOTSTRAP_OWNER_UID`. Once the intended owner has successfully signed in and their database role is verified, remove `BOOTSTRAP_OWNER_UID`, set `OWNER_BOOTSTRAP_COMPLETED=true`, and redeploy. The OWNER role remains in the database; removing the UID prevents automatic re-promotion on later sign-ins.

## Important gates and limitations

- A successful image build is not proof of production readiness.
- The workflow stops if the database is not initialized or no quarry is configured.
- The workflow does not provision Cloud SQL, Firebase, Secret Manager secrets, Workload Identity Federation, IAM permissions, backups, monitoring, or DNS; these are one-time infrastructure setup steps.
- The current JSONB snapshot adapter is not the final relational persistence design. Single-instance deployment reduces but does not eliminate concurrency/data-loss risks.
- Before production use, run authenticated end-to-end tests for Google sign-in, owner bootstrap, all critical create/read/update/delete flows, role restrictions, cross-quarry isolation, persistence after restart, audit-log writes, and restore from backup. Complete normalized repositories, transactionally captured audit before/after values, and database-level tenant isolation before scaling or claiming full production assurance.
