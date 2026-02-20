# YouRL — Design Document (Bigtable-centered)
Team 3: Short Kings — Prepared by Lingyun Wu (Draven)
Date: February 7, 2026 (updated Feb 19, 2026)

Purpose: a concise, implementable design doc for the URL shortener that meets course constraints (GCP-required Bigtable use, Java backend) and the project's latency/availability goals.

Goals & Non-goals
- Goals:
  - Resolve short_code → long_url in <100ms perceived latency for hot URLs.
  - Support shorten (create), resolve (redirect), list (user dashboard), and analytics (click counting).
  - Use Cloud Bigtable as the authoritative durable store (syllabus requirement).
- Non-goals:
  - Complex relational queries or analytics pipelines (these are out of scope; we provide export hooks).
  - Global strong consistency across arbitrary regions (we document expected behavior and mitigations).

Requirements
- Latency: read (resolve) perceived <100ms for hot URLs; write (shorten) <500ms.
- Availability: reads served from nearest Cloud Run region; system should tolerate zone/instance failures.
- Cost: development using emulator or minimal nodes; production limited to low-tier Bigtable nodes for demo.
- Course constraint: must use Cloud Bigtable for primary storage.

System Architecture (high level)
- Frontend: React (Vite) hosted on Firebase Hosting (CDN) — static assets only.
- Auth: Firebase Authentication (JWTs) — backend verifies tokens.
- Compute: Cloud Run (Spring Boot) deployed to multiple regions.
- Cache: Caffeine (in-process per-instance) to hit sub-100ms on hot paths.
- Storage: Cloud Bigtable (tables: `urls`, `users`, `user_urls`).
- Analytics: Pub/Sub + worker (durable, batched increments into Bigtable).
- CI/CD: GitHub Actions → Artifact Registry → Cloud Run; use Workload Identity Federation for auth.

Data Model (Bigtable tables and schemas)
All schemas are implementable Bigtable tables with explicit row keys and column families.

1) `urls` (primary lookup)
- Row key: `short_code` (7-char Base62 random string) — primary key for fast lookups.
- Column families:
  - `meta`: `meta:long_url`, `meta:owner_user_id`, `meta:created_at`, `meta:expires_at`, `meta:is_active`
  - `stats`: `stats:click_count` (stored as integer; use ReadModifyWriteRow or batched updates), `stats:last_access_ts` (optional)

2) `users` (user metadata and quotas)
- Row key: `user_id`
- Column families:
  - `meta`: `meta:email`, `meta:name`, `meta:tier`, `meta:created_at`

3) `user_urls` (secondary index for dashboard)
- Row key options (choose one):
  A) `user_id#reverse_ts#short_code` — supports listing most-recent-first with range/prefix scans.
  B) `user_id#short_code` — simpler, listing requires client-side sort if ordering needed.
- Column families:
  - `meta`: `meta:long_url` (optional denormalized snapshot), `meta:is_active`, `meta:expires_at`, `meta:created_at`

Recommendation: use option A (`user_id#reverse_ts#short_code`) so dashboard listing is a single prefix scan ordered by recency.

Reverse timestamp note:
- Define `reverse_ts` = (Long.MAX_VALUE - epochMillis) encoded as a fixed-width, zero-padded decimal string. This makes newer timestamps sort earlier when scanning lexicographically.
- Dashboard listing: perform a prefix scan on `user_id#` and return the first N rows (most recent first).

Core Flows (step-by-step)

Resolve (redirect) — hot path
1. Client requests GET /{short_code}.
2. Global LB routes to nearest Cloud Run instance.
3. Cloud Run checks Caffeine cache for `short_code`.
  - Hit: return 302 redirect to cached `long_url`.
  - Miss: read row from `urls` by row key `short_code` (Bigtable read).
    - If found and `is_active`: populate Caffeine and return 302.
    - If not found: optionally perform one bounded fallback read to another cluster (see Consistency section), then return 404 if missing.
4. Publish click event to Pub/Sub (non-blocking) for durable analytics; respond immediately.

Shorten (create)
1. Client POST /api/v1/shorten with JWT.
2. Backend verifies JWT, reads `users` metadata to check quota/tier.
3. Enforce quota atomically using a daily counter key (see Rate limiting).
4. Generate random 7-char Base62 `short_code`.
5. Attempt conditional create: `CheckAndMutateRow` / atomic write-if-not-exists into `urls`.
  - If write succeeds: write metadata into `user_urls` (row key `user_id#reverse_ts#short_code`) and return 201 with the short URL.
  - If write fails (collision): retry generation (very low probability).

Delete / expire
- Delete `urls` row and corresponding `user_urls` row (idempotent deletes).

Non-transactional multi-row writes (urls + user_urls)
- Bigtable does not support multi-row transactions. If the `urls` row write succeeds but the `user_urls` write fails (network or transient error), the short URL still resolves correctly because `urls` is authoritative.
- Dashboard listing may momentarily omit the new URL. Mitigations:
  - Retry `user_urls` write asynchronously with exponential backoff (best practice).
  - Periodic reconciliation job (optional) that scans recent `urls` and ensures `user_urls` contains corresponding entries.

Stats (analytics)
- Redirect path publishes click events to Pub/Sub.
- Worker(s) subscribe, batch events, and perform batched ReadModifyWriteRow increments to `urls.stats:click_count` and optionally write aggregated snapshots to `user_urls` for quick dashboard display.

Consistency & Multi-region behavior

Problems to address:
- P1: Read-after-write: a create in region A may not be visible in region B immediately.
- P2: Duplicate short_code generation under replication lag.

Decisions & mitigations (combined approach):
1. Uniqueness: use conditional Bigtable write (`CheckAndMutateRow`) — guarantees "write-if-not-exists" semantics. If it fails, regenerate and retry. This removes the need for centralized ID allocation.
2. Visibility / UX strategy (chosen): primary-write region + bounded fallback reads.
  - Recommendation: designate a primary write region (e.g., `us-central1`) for most creates to reduce global propagation delay.
  - Accept writes in other regions, but clients should expect rare retries on collision.
  - On resolve miss (404) in a region, the service performs one bounded fallback read to the primary cluster (or a different cluster) before returning 404. We configure a primary app profile / single-cluster routing profile used for these bounded fallback reads. If found there, populate local cache and return redirect.
  - Document in UI: "Short URL may take a few seconds to become globally resolvable." This is uncommon and acceptable for the project.

Alternative (not chosen): region-prefixed IDs (adds complexity to UX and slightly longer codes). The chosen approach gives a cleaner user experience while keeping implementation simple.

Performance & Caching

- Cache: Caffeine per Cloud Run instance. Cache stores `short_code -> long_url` entries with TTL and LRU.
-- Cache warmup: after deploys or scale-ups, run a background prefetch for top N hot URLs (optional) or rely on on-demand warmup.
-- Cache + delete/expire correctness:
  - Cache entries must have a bounded TTL (e.g., 5–60 seconds depending on desired freshness).
  - On deactivate/expire, Cloud Run should evict the cache key (if possible) or write a short-lived tombstone; otherwise rely on TTL to expire stale entries.
  - Redirects must always re-check `is_active` when a cache miss occurs; do not serve stale mappings beyond TTL.
-- Latency expectations:
  - Cache hit: ~1-5ms (within instance) + LB/DNS ~15-65ms total perceived for user.
  - Cache miss: Bigtable regional read typically ~10-100ms; cold Cloud Run instances or cross-cluster reads may push to the high end; hence cache is required for consistent <100ms UX.
- Redirect path must not block on analytics: publish to Pub/Sub and return 302 immediately.

Reliability / Failure Modes

- Bigtable node/cluster failure: Cloud Run instances should return 503 if Bigtable is unreachable; implement retries with exponential backoff for transient errors.
- Cache loss (instance restart): results in temporary increased read latency until warmed.
- Analytics loss: Pub/Sub provides durable event delivery; worker should be idempotent.
- Counter/write contention: use Bigtable atomic primitives (`CheckAndMutateRow`, `ReadModifyWriteRow`) to keep correctness under concurrency.

Rate limiting / Quotas

-- Use per-day counters keyed by date to avoid explicit resets. Example key pattern: `users_counters` table with row key `user_id#YYYYMMDD` and column `meta:created_count`.
-- Enforce quota atomically using a CAS-style `CheckAndMutateRow` flow:
  1. Read current counter value for `user_id#YYYYMMDD` (or assume 0 if missing).
  2. Use `CheckAndMutateRow` with a condition like `meta:created_count < max` to atomically increment the value.
  3. If the condition fails due to contention, retry the read+CheckAndMutate cycle a bounded number of times and return 429 on persistent failure.
-- For daily reset, the date-scoped key avoids timed resets; a scheduled job can archive old counters if needed.

Analytics approach (decision)
- Chosen: Pub/Sub + worker batch increments (durable + scalable).
  - Redirect path publishes an event to Pub/Sub (fast, non-blocking).
  - Worker consumes events, batches them, and performs ReadModifyWriteRow increments to `urls.stats:click_count`.
  - Rationale: avoids lost events on instance shutdown, keeps redirect path <100ms, and supports high click throughput.
  - Option A (best-effort background increments) is rejected for production analytics due to durability concerns and has been removed from the design.

Deployment (CI/CD) & Testing

- Pipeline: GitHub Actions → build & test → build Docker image → push to Artifact Registry → deploy to Cloud Run.
- Authentication from GitHub Actions to GCP: Workload Identity Federation (OIDC) recommended — no long-lived service account keys.
- Multi-region deploy: GitHub Actions run a matrix job to deploy the same image to configured regions; use region-specific environment variables (Bigtable cluster IDs) in the deploy step.
- Secrets: store in GCP Secret Manager, expose to Cloud Run via environment variables.
- Local development: use the Cloud Bigtable emulator and local credentials for Firebase Auth integration tests.

Cost plan (dev vs demo)
- Development: use Bigtable emulator and minimal Cloud Run usage; cost ~0.
- Demo/prod: small Bigtable node(s) + Cloud Run multi-region costs; use course-provided Bigtable resources or GCP credits where available and re-evaluate costs after load testing.

Decision log
- Use Cloud Bigtable as primary storage (satisfies syllabus).
- Use Caffeine per-instance cache for hot path latency.
- Use Pub/Sub + worker for analytics.
- Use conditional Bigtable writes for uniqueness; recommend primary-write region + fallback reads for visibility.
- CI/CD via GitHub Actions with Workload Identity Federation; images stored in Artifact Registry and deployed to Cloud Run.

Appendix: Minimal code sketches
- Resolve (pseudocode):
```
@Cacheable("urls")
public String resolve(String shortCode) {
  Row row = bigtableClient.readRow("urls", shortCode);
  return row.getValue("meta", "long_url");
}
```

- Shorten (pseudocode):
```
for (attempts) {
  code = genBase62(7);
  success = bigtableClient.checkAndMutateIfNotExists("urls", code, meta...);
  if (success) { writeUserUrlsIndex(...); break; }
}
```

Decision: this document is the authoritative design doc and the single source of truth for implementation details.
From Deck 2: Users perceive latency as an issue above 100ms. Our read target is <100ms.
