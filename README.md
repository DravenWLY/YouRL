YouRL — Local Development & CI

Quick start (prerequisites)
- Recommended: Install Docker Desktop and ensure the Docker daemon is running.
- Optional (advanced): Colima + Docker CLI can be used, but it may require extra setup (contexts, permissions). Prefer Docker Desktop for new teammates.

Minimal quick run (copy/paste)
1) From the repo root:

```bash
docker compose up --build -d
```

2) Confirm services are running:

```bash
docker compose ps
```

Check backend health:

```bash
curl -i http://localhost:8080/health
# Expect HTTP/1.1 200 and body: ok
```

3) Stop & cleanup:

```bash
docker compose down
```

Notes & troubleshooting
- Backend: http://localhost:8080 (GET /health returns "ok").
- Bigtable emulator: the backend talks to the emulator internally via `BIGTABLE_EMULATOR_HOST=bigtable:8086` inside the compose network. Teammates do NOT normally need to access `localhost:8086` — that is only useful for manual debugging.
- If you see a compose warning about a top-level `version`, it's safe to ignore; the file uses the newer Compose format (or remove the `version:` line to silence the warning).
- If Docker Desktop is not available, see the `Troubleshooting / Alternatives` section below.

CI
- The GitHub Actions workflow `.github/workflows/ci.yml` runs on push/PR to `main` on GitHub-hosted runners. It performs:
  - checkout → setup Java 17 (maven cache) → `mvn test` in `./backend`
  - build the backend Docker image
  - start the image and smoke-test `GET /health`
- Note: CI runs on GitHub runners and does not require local GCP credentials — the workflow only builds/tests and performs a local container smoke test for now.

Current status
- Local Stage 0 scaffold committed: minimal backend, Dockerfile, `docker-compose.yml`, `.github/workflows/ci.yml`, `.dockerignore`, and this `README.md`.

Next milestone (optional)
- Add basic Bigtable read/write endpoints and tests that target the emulator so CI can run integration tests in the future.
# YouRL — URL Shortener Service

**COMP 539 — Software Engineering Methodology — Spring 2026**  
**Team 3: Short Kings**

## Team Members

- Nickolas Hennigh
- Lingyun Wu (Draven)
- Zhe Li (Richard)
- Jiazhen Wu(William)

## Project Overview

A globally distributed URL shortener service deployed on Google Cloud Platform (GCP).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17 + Spring Boot 3 |
| Frontend | React (Vite) + Firebase Hosting |
| Auth | Firebase Authentication |
| Database | Cloud Bigtable (wide-column) |
| Caching | Caffeine (in-process) |
| Compute | GCP Cloud Run |
| Routing | GCP Global HTTP(S) Load Balancer |
| CI/CD | GitHub Actions |
| API Docs | SpringDoc OpenAPI (Swagger UI) |

## Project Structure

```
YouRL/
├── docs/           # Design documents and meeting notes (authoritative design doc: Tech_Stack_Design_Discussion.md)
├── backend/        # Java + Spring Boot API (minimal skeleton included)
├── frontend/       # React + Vite app (TBD)
└── README.md
```

## Getting Started

See the "Local Development & CI" section above for copy/paste run instructions.

## License

This project is for academic purposes (Rice University, COMP 539).
