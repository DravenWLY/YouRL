YouRL — Local Development & CI

Quick start (prerequisites)
- Install Docker Desktop (or Colima + Docker CLI) and ensure the daemon is running.

Run the local stack
1. From the repo root run:

```bash
docker compose up --build -d
```

2. Verify the backend is healthy:

```bash
curl -i http://localhost:8080/health
# Expect HTTP/1.1 200 and body: ok
```

3. View logs (optional):

```bash
docker compose logs -f backend
```

Stop & cleanup

```bash
docker compose down
```

Notes
- Backend: http://localhost:8080 (GET /health returns "ok").
- Bigtable emulator: exposed on localhost:8086 for debugging; the backend connects to it inside compose via `BIGTABLE_EMULATOR_HOST=bigtable:8086`.
- If you see a compose warning about a top-level `version`, it's safe to ignore; the file has been updated to the newer format.

CI
- GitHub Actions workflow `.github/workflows/ci.yml` runs on push/PR to `main` and performs:
  - checkout → setup Java 17 (maven cache) → `mvn test` in `./backend`
  - build the Docker image for the backend
  - start the image and smoke-test `GET /health`

What to push now
- backend/ (source + Dockerfile), `docker-compose.yml`, `.github/workflows/ci.yml`, `.dockerignore`, and this `README.md`.

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
├── backend/        # Java + Spring Boot API (TBD)
├── frontend/       # React + Vite app (TBD)
└── README.md
```

## Getting Started

*Setup instructions will be added once the project is scaffolded.*

## License

This project is for academic purposes (Rice University, COMP 539).
