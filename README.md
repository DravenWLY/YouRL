# YouRL — URL Shortener Service

**COMP 539 — Software Engineering Methodology — Spring 2026**  
**Team 3: Short Kings**

## Team Members

- Nickolas Hennigh
- Lingyun Wu (Draven)
- Beiming Zhang
- Zhe Li (Richard)
- Jiazhen Wu (William)

## Overview

YouRL is a URL shortener built for COMP 539. Our target architecture is:
- Java 17 + Spring Boot backend
- Cloud Bigtable as the primary database
- React (Vite) frontend
- GCP deployment later in the course

## Current MVP Status

Current local MVP supports:
- user signup, login, password change, account upgrade, and account deletion
- `POST /api/shorten` to create a short URL
- `GET /{shortId}` to resolve and redirect
- `GET /api/urls?userId=...` to populate the dashboard
- Bigtable emulator for local storage
- `urls` table with `meta` and `stats` column families
- `users` table for prototype account data

Current request contract:
- `POST /api/shorten` uses JSON
- `GET /{shortId}` returns `302 Found` on success

See `/Users/wulingyun/Desktop/Rice/Courses/Spring 2026/COMP_539/YouRL/docs/API_Contract.md` for the frozen MVP request/response format.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17 + Spring Boot 3 |
| Database | Cloud Bigtable |
| Local DB | Bigtable emulator |
| Frontend | React (Vite) |
| Auth | Firebase Authentication (planned) |
| Caching | Caffeine (planned) |
| Compute | GCP Cloud Run (planned) |
| CI | GitHub Actions |

## Project Structure

```text
YouRL/
├── backend/                     # Spring Boot backend
├── docs/                        # Design and API docs
│   ├── Tech_Stack_Design_Discussion.md
│   └── API_Contract.md
├── docker-compose.yml           # Local backend + Bigtable emulator
└── README.md
```

## Local Development

### Prerequisites
- Docker Desktop running
- Node.js and npm installed

### 1. Start the backend and Bigtable emulator

From the repository root:

```bash
docker compose up --build -d
```

The backend runs on `http://localhost:8080`.

### 2. Verify the backend

```bash
curl -i http://localhost:8080/health
```

Expected:

```text
HTTP/1.1 200
ok
```

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

### 4. Manual test flow

In the browser:
- open `http://localhost:3000`
- optionally sign up or log in
- shorten a URL from the home page
- open the returned short URL and confirm it redirects
- if logged in, check the dashboard and settings pages

### 5. Example backend API calls

Create a short URL anonymously:

```bash
curl -i -X POST http://localhost:8080/api/shorten \
  -H "Content-Type: application/json" \
  --data '{"longUrl":"https://www.rice.edu"}'
```

Resolve a short URL:

```bash
curl -i http://localhost:8080/<shortId>
```

Expected:

```text
HTTP/1.1 302
Location: https://www.rice.edu
```

### 6. Stop the local stack

Stop the frontend dev server with `Ctrl + C`, then from the repository root run:

```bash
docker compose down --remove-orphans
```

## CI

GitHub Actions currently does three things on PRs to `main`:
- runs backend tests
- builds the backend Docker image
- starts the container and smoke-tests `GET /health`

## Near-Term Next Steps

- finish prototype integration and remove remaining placeholder UI
- logging / metrics v1 for shorten and resolve flows
- backend deploy/CD once the working prototype is stable

## License

This project is for academic purposes (Rice University, COMP 539).
