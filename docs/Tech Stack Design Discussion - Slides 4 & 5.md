# YouRL Tech Stack & Life of a Request — Design Discussion
### Team 3: Short Kings | Slides 4 & 5 | Prepared by Lingyun Wu (Draven)
### February 7, 2026

---

## Overview

This document covers my research and design decisions for **Slide 4 (Tech Stack)** and **Slide 5 (Life of a Request)**. Everything here is based on:
- The professor's project spec (GCP required, Java recommended, planet-wide distribution)
- Deck 2's latency lecture ("Slow Sux" — <100ms reads, latency must be designed from the outset)
- Our first pitch decisions (Base62 encoding, <100ms read / <500ms write targets, eventual consistency)
- Practical constraints: 4 team members, one semester, keep it simple and free

**Key principle: Design for what 4 people can actually build, not for what Google would build.**

---

## Tech Stack Decisions

| Layer | Technology | Cost |
|---|---|---|
| Backend | Java 17 + Spring Boot 3 | Free |
| Frontend | React (Vite) on Firebase Hosting | Free |
| Authentication | Firebase Authentication | Free (10K auths/month) |
| Database | Firestore (NoSQL) | Free (50K reads/day, 20K writes/day) |
| Caching | Caffeine (in-process Java cache) | Free |
| Compute | GCP Cloud Run (serverless containers) | Free tier (2M requests/month) |
| Global Routing | GCP Global HTTP(S) Load Balancer | ~$18/month (covered by $300 GCP credits) |
| Containers | Docker (built by Spring Boot) | Free |
| CI/CD | GitHub Actions → Cloud Build → Cloud Run | Free |
| API Docs | SpringDoc OpenAPI (Swagger UI) | Free |
| Monitoring | GCP Cloud Monitoring | Free (built into Cloud Run) |

**Total cost during development: $0**  
**Total cost with multi-region: ~$18/month (covered by GCP $300 free credits for new accounts)**

---

## 1. Backend: Java 17 + Spring Boot 3

**Status: Confirmed by team.**

- Professor recommended Java explicitly in the project spec
- Spring Boot is the industry standard Java web framework
- Provides: built-in REST API framework, dependency injection, caching annotations (`@Cacheable`), async support (`@Async`), testing framework, and Docker image building
- Massive documentation and community — easy to find answers to any problem

No further discussion needed.

---

## 2. Frontend: React (Vite) + Firebase Hosting

### What the Frontend Actually Does

The URL shortener frontend is simple:
- A form: user pastes a long URL, clicks "Shorten", gets the short URL
- A dashboard page: shows user's URLs, click counts, expiration status
- Login/register page (handled by Firebase Auth — see Section 5)
- Maybe a stats page for individual URLs

This is NOT a complex frontend. No real-time data, no complex state, no heavy interactivity.

### Why React + Vite

- **React**: I have experience with it. The frontend is not where our grade lives — go with what we know.
- **Vite**: Replaces Create React App (CRA), which is officially deprecated. Vite starts in <1 second vs CRA's 10-30 seconds. Same React development experience, just faster tooling. Setup: `npm create vite@latest frontend -- --template react`

### Why Firebase Hosting (not Cloud Run)

Our React app, after building, is just static HTML/CSS/JS files. These don't need a server.

- **Firebase Hosting** serves static files via Google's global CDN — frontend loads fast worldwide
- Free tier: 10GB storage, 10GB/month transfer (more than enough)
- One-command deploy: `firebase deploy`
- HTTPS + custom domain support built in
- Keeps the frontend completely free and separate from the backend

**How they connect:**
```
User opens you.rl
  → Firebase Hosting (CDN) serves React app (static files)
  → User interacts with the app
  → React calls backend API on Cloud Run (POST /api/v1/shorten, etc.)
  → Backend returns data
  → React displays it
```

---

## 3. Database: Why Firestore (NoSQL)

### This is the most important design decision.

### Our Data Model

```
Users Collection:
  user_id: "abc123"
  email: "draven@rice.edu"
  name: "Lingyun Wu"
  subscription_tier: "free" | "premium"
  subscription_expires: timestamp
  urls_created_today: 5
  max_urls_per_day: 10  (free: 10, premium: unlimited)
  created_at: timestamp

URLs Collection:
  short_code: "aZ3kP9Q"          ← document ID (primary key)
  long_url: "https://very-long-url.com/..."
  user_id: "abc123"               ← who created this
  created_at: timestamp
  expires_at: timestamp           ← null for premium permanent links
  click_count: 42
  is_active: true
```

### Why NoSQL Over SQL?

Our core access patterns are:

| Query | Frequency | Firestore Performance |
|---|---|---|
| Resolve URL: look up `short_code` → get `long_url` | **Extremely hot** (every click) | Direct document lookup by ID: **<10ms** |
| Get user's URLs: list all URLs where `user_id == X` | Medium (dashboard view) | Index query: **<50ms** |
| Check user subscription: look up `user_id` | Medium (on API calls) | Direct document lookup: **<10ms** |
| Create URL: write new document | Low (relative to reads) | Document write: **<50ms** |

**Key insight: We never need JOINs.** The resolution path (the hot path, the latency-sensitive one) never touches user data — it just looks up the short code. User data is only needed when creating URLs or viewing the dashboard.

### SQL vs NoSQL Comparison for Our Use Case

| | SQL (Cloud SQL / PostgreSQL) | NoSQL (Firestore) |
|---|---|---|
| Key-value lookup speed | Good (~10-30ms) | Excellent (<10ms) |
| Multi-region replication | Manual setup (read replicas, complex) | **Automatic (check a box)** |
| Free tier | No real free tier (~$7-10/month min) | **50K reads/day, 20K writes/day, 1GB free** |
| Infrastructure management | Connection pools, migrations, backups | **Zero — fully managed** |
| Complex JOINs | Excellent | Not supported (but we don't need them) |
| Horizontal scaling | Hard (requires sharding) | **Automatic** |
| Spring Boot support | Standard (JPA/Hibernate) | Official `spring-cloud-gcp-starter-firestore` |

### What About User Management & Subscriptions?

"Users have URLs" sounds relational, but it's not complex:

- **To get a user's URLs**: Query `urls` collection where `user_id == "abc123"`. Firestore supports this natively with indexes. One query, no JOINs.
- **To check subscription**: Read `users/abc123` document. One lookup.
- **To enforce rate limits**: Read user doc → check `urls_created_today` vs `max_urls_per_day` → allow or reject.

None of this requires SQL. Each operation is a single document read or a simple indexed query.

### When Would We Actually Need SQL?

If we had queries like "find all users whose premium subscription expires this week who have URLs with >1000 clicks in the last 30 days" — complex JOINs + aggregations across tables. We don't have those. Our queries are: look up by key, list by owner, count clicks.

### Firestore Pros (for our project)

1. **Free** — generous free tier is more than enough for a class project
2. **Multi-region replication is automatic** — directly fulfills the "planet-wide" requirement with zero DevOps
3. **Key-value access is its strongest operation** — exactly what URL resolution needs
4. **Zero infrastructure** — no servers, connection pools, backups, or schema migrations
5. **Sub-10ms reads** from the same region
6. **Scales automatically** — handles traffic spikes without configuration
7. **Works seamlessly with Firebase Auth** — same ecosystem

### Firestore Cons (being honest)

1. **Different query model** — no SQL syntax, uses API-based queries (but our queries are simple)
2. **Limited complex queries** — no JOINs or subqueries (but we don't need them)
3. **Eventual consistency across regions** — a URL created in NAM might take a few hundred ms to appear in APAC (acceptable for URL shortener — the creator gets the short URL immediately)
4. **Vendor lock-in** — Firestore is GCP-only (irrelevant since professor requires GCP)

### Decision: Firestore ✅

The advantages (free, auto multi-region, zero ops, perfect for key-value lookups) far outweigh the cons for our specific use case.

---

## 4. Caching: Caffeine (In-Process)

### Why Caching Matters (Professor's Latency Lecture)

From Deck 2: Users perceive latency as an issue above 100ms. Our read target is <100ms.

```
Without cache:  User click → Cloud Run → Firestore query → response (~50-150ms)
                ⚠️ Might miss 100ms target for cold Firestore queries

With cache:     User click → Cloud Run → Caffeine (in-memory) → response (~1-5ms)
                ✅ Well under 100ms, feels instant
```

### Why Caffeine Instead of Redis

| | Redis (Memorystore) | Caffeine (in-process) |
|---|---|---|
| Speed | ~1-5ms (network hop) | **<1ms (in same JVM, no network)** |
| Cost | ~$12+/month per region | **Free (Java library)** |
| Infrastructure | Separate server to manage | **No infrastructure — just a dependency** |
| Setup | Provision, configure, connect | **Add one Maven dependency** |
| Shared across instances | Yes | No (each Cloud Run instance has own cache) |

For our project, the "not shared" limitation doesn't matter:
- URL mappings are **immutable** — `aZ3kP9Q` always maps to the same long URL
- Each Cloud Run instance builds its own cache from traffic — hot URLs get cached quickly
- Even on a cache miss, Firestore responds in ~50ms, which is still under target

### Implementation (2 lines in Spring Boot)

```java
@Cacheable("urls")
public String resolve(String shortCode) {
    return firestore.collection("urls").document(shortCode).get()...;
}
```

Spring Boot + Caffeine handles everything: cache sizing, eviction, TTL.

---

## 5. Authentication: Firebase Authentication

### Why Not Build Our Own?

Building login/register from scratch is a massive security liability and weeks of work:
- Password hashing (bcrypt)
- Email verification
- Token management (JWT creation, signing, refresh)
- Session handling
- Password reset flow
- Brute force protection
- Rate limiting on auth endpoints

**Firebase Auth does all of this for free** (up to 10K authentications/month).

### What Firebase Auth Gives Us

- Email/password registration and login
- Google Sign-In (one click for users)
- GitHub Sign-In (convenient for our Rice audience)
- JWT tokens that our Spring Boot backend verifies
- All security handled (bcrypt, rate limiting, brute force protection)

### Flow

```
User clicks "Sign in with Google"
  → Firebase Auth handles OAuth flow
  → Returns a JWT token to the React app
  → React includes token in every API request (Authorization header)
  → Spring Boot verifies JWT with Firebase Admin SDK (one line of code)
  → Backend knows: user ID, email, and can look up subscription in Firestore
```

This is the **industry standard** — even large companies use Firebase Auth or Auth0 instead of building their own.

---

## 6. Compute: Cloud Run (Why Docker Containers)

### What Docker Does

Docker packages our app + its exact runtime environment into a **container** — a lightweight, portable box containing:
- Our compiled Spring Boot app
- Java 17 runtime
- All dependencies
- Required OS libraries

This container runs **identically** everywhere — Mac, Windows, Linux, Cloud Run.

### Why We Need It

**Cloud Run requires a Docker container.** It's the delivery mechanism — not optional.

Good news: Spring Boot builds the Docker image automatically:
```bash
./mvnw spring-boot:build-image
```

Then deploy:
```bash
gcloud run deploy urlshortener --image=<image> --region=us-central1
```

### Why Cloud Run (Not a VM or Kubernetes)

| Option | Complexity | Cost | Why Not |
|---|---|---|---|
| **VM (Compute Engine)** | Must manage OS, updates, scaling | ~$5-25/month always on | Too much ops work |
| **Kubernetes (GKE)** | Very complex orchestration | ~$70+/month minimum | Way overkill for 4 students |
| **Cloud Run** | Zero management, auto-scales | **Free tier: 2M requests/month** | ✅ **This one** |

Cloud Run:
- Scales to zero when no traffic (no cost during idle time)
- Scales up automatically under load
- Deploy to multiple regions with the same command
- Built-in HTTPS, health checks, logging

---

## 7. CI/CD: GitHub Actions

### What CI/CD Does

- **CI (Continuous Integration)**: Every push to GitHub automatically builds and tests the code
- **CD (Continuous Deployment)**: If tests pass, automatically deploys to Cloud Run

### Without CI/CD

Every deployment requires someone to manually:
1. Pull latest code → 2. Run tests → 3. Build Docker image → 4. Push to registry → 5. Deploy to Cloud Run

With 4 people pushing code, this becomes chaos.

### With CI/CD

```
Push code to GitHub
  → GitHub Actions automatically:
    1. Runs all tests (catches bugs before deploy)
    2. Builds Docker image
    3. Pushes to GCP Artifact Registry
    4. Deploys to Cloud Run
  → Live in ~3 minutes, zero manual work
```

We write the pipeline config once (a YAML file), and it works forever. Free for public repos, 2,000 minutes/month free for private repos.

### Why It Matters

- 4 people coding simultaneously — CI catches broken code before production
- Saves hours of manual deployment over the semester
- Professor will appreciate it — CI/CD is core software engineering methodology (it's literally the course title)

---

## 8. API Documentation: SpringDoc OpenAPI (Swagger)

### What It Does

Auto-generates interactive API documentation from our code. After adding one Maven dependency, a web page is available at `our-api.com/swagger-ui` showing:
- Every endpoint (URL, method, description)
- Request body schemas (what JSON to send)
- Response schemas (what JSON comes back)
- Authentication requirements
- A "Try it out" button to test endpoints live in the browser

### Why We Need It

- **4 people, different parts** — the frontend developer needs to know exactly what the backend accepts/returns. Without docs: constant "hey, what's the endpoint for X?"
- **Professor asked to "explain the APIs"** — having Swagger UI live is a powerful demo
- **Zero effort** — add one Maven dependency and annotate controllers. The documentation stays in sync with the code automatically.

---

## Life of a Request (Slide 5 Content)

### Request Type 1: Resolve URL (The Hot Path — Most Critical)

This is what happens millions of times: someone clicks a short URL.

```
1. USER CLICK
   User clicks https://you.rl/aZ3kP9Q

2. DNS RESOLUTION
   Browser resolves you.rl → GCP Global Load Balancer IP
   (~10-50ms, cached by browser after first visit)

3. GLOBAL LOAD BALANCER
   GCP routes request to nearest regional Cloud Run instance
   (user in Europe → europe-west1, user in US → us-central1)
   (~5-10ms)

4. CLOUD RUN (Spring Boot)
   Receives GET /aZ3kP9Q
   Extracts code: "aZ3kP9Q"

5. CACHE CHECK (Caffeine)
   Checks in-memory cache for "aZ3kP9Q"

   ✅ CACHE HIT → Go to step 7 (total: ~1-5ms from Cloud Run)
   ❌ CACHE MISS → Go to step 6

6. DATABASE QUERY (Firestore)
   Queries Firestore: documents("urls").document("aZ3kP9Q")
   Gets back: { long_url: "https://...", is_active: true, ... }
   Populates Caffeine cache for next time
   (~10-50ms from same region)

7. ASYNC ANALYTICS
   Fires non-blocking event to increment click_count
   Uses Spring @Async — does NOT block the response
   (~0ms added to user-facing latency)

8. RESPONSE
   Returns HTTP 302 Found
   Location: https://original-long-url.com/page
   Browser redirects user to destination
```

**Total latency:**
- Cache hit: **~15-65ms** (DNS + LB + cache) ✅ Well under 100ms
- Cache miss: **~25-115ms** (DNS + LB + Firestore) ✅ At or under 100ms target
- Repeat visits: DNS cached by browser, so even faster

**Why 302 (not 301)?**
- 301 = browser caches redirect permanently → we LOSE analytics (browser never hits our server again)
- 302 = browser checks with us every time → we CAPTURE every click
- Since analytics is a feature in our pitch, 302 is the correct default

### Request Type 2: Shorten URL (Write Path)

```
1. USER ACTION
   User submits long URL via React frontend
   React sends: POST /api/v1/shorten
   Body: { "long_url": "https://very-long-example.com/page?q=1" }
   Headers: Authorization: Bearer <Firebase JWT>

2. DNS + GLOBAL LOAD BALANCER
   Routes to nearest Cloud Run instance
   (~15-60ms)

3. CLOUD RUN (Spring Boot)
   a. Verify JWT token with Firebase Admin SDK
      → Identifies user, checks subscription tier
   b. Check rate limit: user.urls_created_today < user.max_urls_per_day?
      → Free user over limit? Return 429 Too Many Requests
   c. Generate short code:
      → Random 7-character Base62 string (e.g., "bK9mW2x")
      → Check Firestore if code exists (collision check)
      → Collision? Regenerate (probability: ~1 in 3.5 trillion)
   d. Write to Firestore:
      → Create document in "urls" collection with short_code as ID
      → Update user's urls_created_today counter

4. RESPONSE
   Returns: { "short_url": "https://you.rl/bK9mW2x" }
   HTTP 201 Created
```

**Total latency: ~200-400ms**
- JWT verification: ~10-20ms
- Code generation + collision check: ~10-50ms
- Firestore write: ~50-200ms
- Network overhead: ~50-100ms

✅ Well under 500ms write target.

**Note on multi-region writes:** Firestore handles replication automatically. After the write completes in the primary region, data propagates to other regions within a few hundred milliseconds. A user in APAC who creates a URL can share it immediately — by the time someone in NAM clicks it (even seconds later), the data is already replicated.

---

## Architecture Diagram (For Reference — Coordinate with Slide 1)

```
                         ┌─────────────────────────┐
                         │   Firebase Hosting (CDN) │
                         │   React Frontend         │
                         └────────────┬─────────────┘
                                      │ API calls
                         ┌────────────▼─────────────┐
                         │  GCP Global HTTP(S) LB   │
                         │  (routes by geolocation) │
                         └──┬─────────┬──────────┬──┘
                            │         │          │
               ┌────────────▼──┐  ┌───▼────────┐ ┌▼────────────┐
               │  Cloud Run    │  │ Cloud Run  │ │ Cloud Run   │
               │  us-central1  │  │ eu-west1   │ │ asia-east1  │
               │               │  │            │ │             │
               │ Spring Boot   │  │ Spring Boot│ │ Spring Boot │
               │ + Caffeine    │  │ + Caffeine │ │ + Caffeine  │
               │   Cache       │  │   Cache    │ │   Cache     │
               └──────┬────────┘  └─────┬──────┘ └──────┬──────┘
                      │                 │               │
                      └─────────┬───────┘───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │      Firestore        │
                    │  (multi-region,       │
                    │   auto-replicated)    │
                    │                       │
                    │  Collections:         │
                    │  - users              │
                    │  - urls               │
                    └───────────────────────┘

                    ┌───────────────────────┐
                    │   Firebase Auth       │
                    │  (Google Sign-In,     │
                    │   email/password)     │
                    └───────────────────────┘
```

---

## Questions for the Team

1. **Do we all agree on Firestore over Cloud SQL?** I believe Firestore is the right choice for our use case (see Section 3), but happy to discuss.
2. **Whoever is doing Slide 1 (architecture):** Let's make sure our diagrams and technology names match. The stack above is what I'll use in Slides 4 & 5.
3. **Do we want to mention Firebase Auth in the presentation?** It's technically part of the tech stack. I think it's worth one bullet point since it shows we've thought about user management for the subscription model.
4. **301 vs 302 redirect:** I recommend 302 as the default (we keep analytics). Agree?

---

*Document prepared by Lingyun Wu (Draven) — Feb 7, 2026*
*Feel free to comment or suggest changes before I finalize the slides.*
