# Backend Deployment (Cloud Run)

Current deployment scope is backend-only.

- frontend remains a separate React/Vite app
- backend deploys to Cloud Run
- Bigtable remains the primary database

## GitHub Secrets required

Add these repository secrets before running the deploy workflow:

- `GCP_SA_KEY`
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GAR_REPOSITORY`
- `CLOUD_RUN_SERVICE`
- `BIGTABLE_INSTANCE_ID`
- `BIGTABLE_TABLE_ID`
- `BIGTABLE_META_FAMILY`
- `BIGTABLE_STATS_FAMILY`
- `BIGTABLE_USERS_TABLE_ID`
- `BIGTABLE_USER_INFO_FAMILY`

Recommended current values:

- `BIGTABLE_TABLE_ID=urls`
- `BIGTABLE_META_FAMILY=meta`
- `BIGTABLE_STATS_FAMILY=stats`
- `BIGTABLE_USERS_TABLE_ID=users`
- `BIGTABLE_USER_INFO_FAMILY=info`

## Workflow

File:

- `.github/workflows/deploy-backend.yml`

This workflow:

1. authenticates to GCP using the service account key
2. builds the backend Docker image
3. pushes the image to Artifact Registry
4. deploys the backend to Cloud Run
5. prints the deployed service URL

## How to run it

1. Push the branch to GitHub
2. Open GitHub Actions
3. Select `Deploy Backend`
4. Click `Run workflow`

## Notes

- Do not commit the service account key into the repository
- Do not paste the key into chat tools
- For now, deploy the backend first and keep frontend deployment separate
