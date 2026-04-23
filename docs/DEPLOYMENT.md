# Backend Deployment

Current deployment scope is backend-only.

- frontend remains a separate React/Vite app
- backend is prepared for App Engine now
- Kubernetes manifests are kept in the repo as a later-path option
- Bigtable remains the primary database

## Recommended prototype path

Because Artifact Registry / Cloud Run / GKE access may be restricted for some team members, the most practical
prototype path is App Engine.

This matches the syllabus guidance that App Engine is historically the shortest path to a working prototype for
Java on GCP.

## App Engine workflow

Files:

- `/Users/wulingyun/Desktop/Rice/Courses/Spring 2026/COMP_539/YouRL/.github/workflows/deploy-backend.yml`
- `/Users/wulingyun/Desktop/Rice/Courses/Spring 2026/COMP_539/YouRL/backend/src/main/app.yaml`

The workflow:

1. authenticates to GCP using the service account key
2. deploys the backend Maven project to App Engine
3. uses the existing Cloud Build bucket as the staging bucket
3. prints the App Engine service URL

## GitHub configuration needed

### Repository secret
- `GCP_SA_KEY`

### Repository variable
- `GCP_PROJECT_ID = rice-comp-539-spring-2022`

## App Engine configuration

Current `app.yaml` uses:

- `runtime: java17`
- `instance_class: F1`
- Bigtable environment variables for the current project and tables

## Current Bigtable values

The current App Engine config uses these values:

- `BIGTABLE_PROJECT_ID=rice-comp-539-spring-2022`
- `BIGTABLE_INSTANCE_ID=shared-instance-id`
- `BIGTABLE_TABLE_ID=urls`
- `BIGTABLE_META_FAMILY=meta`
- `BIGTABLE_STATS_FAMILY=stats`
- `BIGTABLE_USERS_TABLE_ID=users`
- `BIGTABLE_USER_INFO_FAMILY=info`

## How to run it

1. Push the branch to GitHub
2. Open GitHub Actions
3. Select `Deploy Backend`
4. Click `Run workflow`

## Notes

- Do not commit the service account key into the repository
- Do not paste the key into chat tools
- The deploy workflow uses `gs://<GCP_PROJECT_ID>_cloudbuild` as the staging bucket to avoid relying on the missing default `staging.<project>.appspot.com` bucket
- For now, deploy the backend first and keep frontend deployment separate
- Kubernetes manifests are still in the repo if the team later gets cluster access
