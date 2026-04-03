# YouRL API Contract (MVP v1)

This document freezes the current backend contract so frontend and backend work can proceed in parallel without guessing request or response formats.

## Scope

MVP v1 covers the core shorten-and-resolve flow only:

- create a short URL
- resolve a short URL
- support optional expiration metadata

User accounts, dashboards, and analytics endpoints are intentionally deferred to later milestones.

## `POST /api/shorten`

Create a short URL mapping in Bigtable.

### Request

`Content-Type: application/json`

```json
{
  "longUrl": "https://www.rice.edu",
  "expiresAt": "2026-04-10T18:30:00Z"
}
```

Notes:

- `longUrl` is required and must be a valid `http` or `https` URL.
- `expiresAt` is optional and must be in ISO-8601 UTC format if provided.
- `expiresAt` must be in the future.

### Success response

`200 OK`

```json
{
  "shortId": "aB3x9Qp",
  "shortUrl": "http://localhost:8080/aB3x9Qp",
  "longUrl": "https://www.rice.edu",
  "createdAt": "2026-04-02T23:15:42.019Z",
  "expiresAt": "2026-04-10T18:30:00Z"
}
```

### Error responses

`400 Bad Request`

```json
{
  "error": "longUrl must be a valid http or https URL"
}
```

`503 Service Unavailable`

```json
{
  "error": "Bigtable is unavailable"
}
```

## `GET /{shortId}`

Resolve a short URL and redirect to the original destination.

### Success response

`302 Found`

Headers:

```text
Location: https://www.rice.edu
```

### Error responses

`404 Not Found`

- returned when the short code does not exist
- also returned when the link is inactive or expired

`503 Service Unavailable`

- returned when Bigtable is unavailable

## Notes for frontend integration

- Frontend should treat `POST /api/shorten` as a JSON API.
- Frontend should not construct the redirect URL from raw text; use the returned `shortUrl`.
- Redirect resolution is not a JSON API. The browser should simply navigate to the short URL and expect a `302`.
