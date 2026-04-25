# Deployment

The current prototype deploys backend and frontend as separate App Engine services.

- backend service: `team3-shortkings`
- frontend service: `team3-shortkings-frontend`
- project: `rice-comp-539-spring-2022`
- staging bucket: `gs://rice-comp-539-spring-2022_cloudbuild`
- runtime service account: `stonks-2025@rice-comp-539-spring-2022.iam.gserviceaccount.com`

This separation matches the practical industry pattern for a React SPA plus API service: frontend and backend can be built, deployed, rolled back, and scaled independently.

## Why App Engine

Artifact Registry, Cloud Run, and GKE permissions are restricted in the shared class project. App Engine is the shortest stable deployment path available for the current prototype and matches the course's suggested deployment options.

Kubernetes manifests remain in the repo as a later-path option, but App Engine is the active deployment target.

## GitHub Actions Workflows

Files:

- `.github/workflows/deploy-backend.yml`
- `.github/workflows/deploy-frontend.yml`
- `backend/src/main/app.yaml`
- `frontend/app.yaml`

Both workflows are manually triggered with `workflow_dispatch`.

Backend workflow:

1. authenticates to GCP with `GCP_SA_KEY`
2. deploys `backend/pom.xml` with `backend/src/main/app.yaml`
3. uses the existing Cloud Build bucket as the App Engine staging bucket
4. prints the deployed backend service URL

Frontend workflow:

1. authenticates to GCP with `GCP_SA_KEY`
2. installs Node dependencies
3. builds the Vite app with `VITE_API_BASE_URL` pointing at the backend App Engine service
4. deploys `frontend/app.yaml`
5. prints the deployed frontend service URL

## GitHub Configuration

Repository secret:

- `GCP_SA_KEY`: full JSON service account key. Do not commit this file or paste it into chat.

Repository variable:

- `GCP_PROJECT_ID=rice-comp-539-spring-2022`

## Backend App Engine Configuration

`backend/src/main/app.yaml` currently uses:

- `runtime: java17`
- `instance_class: F1`
- `service: team3-shortkings`
- `service_account: stonks-2025@rice-comp-539-spring-2022.iam.gserviceaccount.com`

Bigtable environment values:

- `BIGTABLE_PROJECT_ID=rice-comp-539-spring-2022`
- `BIGTABLE_INSTANCE_ID=shared-instance-id`
- `BIGTABLE_TABLE_ID=urls`
- `BIGTABLE_META_FAMILY=meta`
- `BIGTABLE_STATS_FAMILY=stats`
- `BIGTABLE_USERS_TABLE_ID=users`
- `BIGTABLE_USER_INFO_FAMILY=info`

CORS/frontend values:

- `FRONTEND_ALLOWED_ORIGINS=https://team3-shortkings-frontend-dot-rice-comp-539-spring-2022.uk.r.appspot.com,http://localhost:3000`
- `YOURL_FRONTEND_BASE_URL=https://team3-shortkings-frontend-dot-rice-comp-539-spring-2022.uk.r.appspot.com`

Authentication notes:

- The MVP uses email/password signup and login.
- Real email verification and SMTP delivery are future work and are not required for the current demo.

## Frontend App Engine Configuration

`frontend/app.yaml` currently uses:

- `runtime: nodejs22`
- `service: team3-shortkings-frontend`
- `service_account: stonks-2025@rice-comp-539-spring-2022.iam.gserviceaccount.com`
- `instance_class: F1`

The frontend build reads the API base URL from `VITE_API_BASE_URL` during GitHub Actions.

## How To Deploy

Backend:

1. Push the branch to GitHub.
2. Open GitHub Actions.
3. Select `Deploy Backend`.
4. Click `Run workflow`.

Frontend:

1. Push the branch to GitHub.
2. Open GitHub Actions.
3. Select `Deploy Frontend`.
4. Click `Run workflow`.

Deploy backend first when API or CORS settings change. Deploy frontend after frontend UI or `VITE_API_BASE_URL` changes.

## Notes

- Do not commit the service account key into the repository.
- Do not paste the key into chat tools.
- The deploy workflow uses `gs://<GCP_PROJECT_ID>_cloudbuild` to avoid relying on the missing default `staging.<project>.appspot.com` bucket.
- App Engine keeps old versions; redeploying creates a new version and routes traffic to it.
- Separate App Engine service names prevent other teams from overwriting Team 3's backend/frontend services.
