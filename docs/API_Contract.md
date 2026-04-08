# YouRL API Contract (MVP v1)

This document freezes the current backend contract so frontend and backend work can proceed in parallel without guessing request or response formats.

## Scope

MVP v1 covers the current working prototype:

- create a short URL
- resolve a short URL
- associate created links with a signed-in user
- list a signed-in user's URLs for the dashboard

Current product behavior:

- repeating `POST /api/shorten` for the same long URL creates a new short URL each time
- expiration is not part of the current frontend product flow
- analytics are limited to click counts and last-access timestamps

## `POST /api/shorten`

Create a short URL mapping in Bigtable.

### Request

`Content-Type: application/json`

```json
{
  "longUrl": "https://www.rice.edu",
  "userId": "abc12"
}
```

Notes:

- `longUrl` is required and must be a valid `http` or `https` URL.
- `userId` is optional and associates the short URL with an account for dashboard display.
- If `userId` is omitted, the link is created anonymously. In the current frontend prototype, anonymous links created in the same browser session are automatically claimed after signup or login.

### Success response

`200 OK`

```json
{
  "shortId": "aB3x9Qp",
  "shortUrl": "http://localhost:8080/aB3x9Qp",
  "longUrl": "https://www.rice.edu",
  "userId": "abc12",
  "createdAt": "2026-04-02T23:15:42.019Z"
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

- returned when the short code does not exist or is inactive

`503 Service Unavailable`

- returned when Bigtable is unavailable

## `GET /api/urls?userId={userId}`

Return the current user's shortened URLs for the dashboard.

### Success response

`200 OK`

```json
[
  {
    "shortId": "aB3x9Qp",
    "shortUrl": "http://localhost:8080/aB3x9Qp",
    "longUrl": "https://www.rice.edu",
    "createdAt": "2026-04-02T23:15:42.019Z",
    "clickCount": 3,
    "lastAccessTs": "2026-04-08T16:30:11.000Z",
    "active": true
  }
]
```

### Error responses

`400 Bad Request`

```json
{
  "error": "userId is required"
}
```

`503 Service Unavailable`

```json
{
  "error": "Bigtable is unavailable"
}
```

## `POST /api/urls/claim`

Associate previously anonymous short URLs with a signed-in user.

### Request

`Content-Type: application/json`

```json
{
  "userId": "abc12",
  "shortIds": ["aB3x9Qp", "Z8mN4rT"]
}
```

### Success response

`200 OK`

```json
{
  "claimedCount": 2
}
```

## Notes for frontend integration

- Frontend should treat `POST /api/shorten` as a JSON API.
- Frontend should not construct the redirect URL from raw text; use the returned `shortUrl`.
- Redirect resolution is not a JSON API. The browser should simply navigate to the short URL and expect a `302`.
