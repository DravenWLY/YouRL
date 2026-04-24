# Deployment

## Current deployment layout

The project now deploys frontend and backend separately on App Engine.

- backend service: `team3-shortkings`
- frontend service: `team3-shortkings-frontend`
- database: Cloud Bigtable

Runtime URLs:

- backend: `https://team3-shortkings-dot-rice-comp-539-spring-2022.uk.r.appspot.com`
- frontend: `https://team3-shortkings-frontend-dot-rice-comp-539-spring-2022.uk.r.appspot.com`

## GitHub configuration needed

Repository secret:

- `GCP_SA_KEY`

Repository variable:

- `GCP_PROJECT_ID=rice-comp-539-spring-2022`

## Backend deployment

Files:

- `/Users/wulingyun/Desktop/Rice/Courses/Spring2026/COMP_539/YouRL/.github/workflows/deploy-backend.yml`
- `/Users/wulingyun/Desktop/Rice/Courses/Spring2026/COMP_539/YouRL/backend/src/main/app.yaml`
- `/Users/wulingyun/Desktop/Rice/Courses/Spring2026/COMP_539/YouRL/backend/src/main/java/org/yourl/backend/CorsConfig.java`

The backend workflow:

1. authenticates to GCP with the service account key
2. deploys the Spring Boot Maven app to App Engine
3. uses `gs://<GCP_PROJECT_ID>_cloudbuild` as the staging bucket
4. serves the backend under the `team3-shortkings` App Engine service

The backend App Engine config uses:

- `runtime: java17`
- `service: team3-shortkings`
- `service_account: stonks-2025@rice-comp-539-spring-2022.iam.gserviceaccount.com`
- Bigtable environment variables for the current project and tables
- `FRONTEND_ALLOWED_ORIGINS` to allow the deployed frontend origin and local Vite dev server

## Frontend deployment

Files:

- `/Users/wulingyun/Desktop/Rice/Courses/Spring2026/COMP_539/YouRL/.github/workflows/deploy-frontend.yml`
- `/Users/wulingyun/Desktop/Rice/Courses/Spring2026/COMP_539/YouRL/frontend/app.yaml`
- `/Users/wulingyun/Desktop/Rice/Courses/Spring2026/COMP_539/YouRL/frontend/server.mjs`
- `/Users/wulingyun/Desktop/Rice/Courses/Spring2026/COMP_539/YouRL/frontend/src/services/config.ts`

The frontend workflow:

1. authenticates to GCP with the same service account key
2. builds the Vite frontend with `VITE_API_BASE_URL` pointing at the backend App Engine service
3. deploys the static frontend to App Engine under `team3-shortkings-frontend`

The frontend App Engine config uses:

- `runtime: nodejs22`
- `service: team3-shortkings-frontend`
- `service_account: stonks-2025@rice-comp-539-spring-2022.iam.gserviceaccount.com`

The frontend uses a small Node server to serve the built SPA and fall back to `index.html` for client-side routes.

## Manual deployment fallback

If GitHub Actions is unavailable, both services can be deployed manually with the same App Engine configs using the `stonks-2025` service account key.

Backend:

```bash
cd backend
gcloud app deploy pom.xml \
  --appyaml=src/main/app.yaml \
  --project=rice-comp-539-spring-2022 \
  --bucket=gs://rice-comp-539-spring-2022_cloudbuild
```

Frontend:

```bash
cd frontend
VITE_API_BASE_URL="https://team3-shortkings-dot-rice-comp-539-spring-2022.uk.r.appspot.com" npm run build
gcloud app deploy app.yaml \
  --project=rice-comp-539-spring-2022 \
  --bucket=gs://rice-comp-539-spring-2022_cloudbuild
```
