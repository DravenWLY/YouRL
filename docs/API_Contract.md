# YouRL API Contract (MVP v1)

This document freezes the current backend contract so frontend and backend work can proceed in parallel without guessing request or response formats.

## Scope

MVP v1 covers the current working prototype:

- email-based signup and login
- create a short URL
- resolve a short URL
- associate created links with a signed-in user
- list a signed-in user's URLs for the dashboard
- prototype premium checkout and cancellation

Current product behavior:

- repeating `POST /api/shorten` for the same long URL creates a new short URL each time
- expiration is not part of the current frontend product flow
- analytics are limited to click counts and last-access timestamps
- premium accounts can request custom short codes; free accounts use generated short codes
- signup/login use email addresses, but email verification is future work

## `POST /api/users/signup`

Create an account using an email address.

### Request

`Content-Type: application/json`

```json
{
  "email": "name@rice.edu",
  "password": "secret123"
}
```

Notes:

- `email` is required and must be a valid email address.
- Duplicate emails are rejected.
- The current MVP does not require email verification before login.

### Success response

`200 OK`

```json
{
  "email": "name@rice.edu",
  "userId": "abc12",
  "isPaid": false,
  "emailVerified": true,
  "verificationSentAt": null,
  "verificationPreviewUrl": null,
  "premiumPlan": "free",
  "subscriptionStatus": "inactive",
  "autoRenew": false,
  "currentPeriodEnd": null
}
```

### Error responses

`400 Bad Request`

```json
{
  "error": "Email must be valid"
}
```

`400 Bad Request`

```json
{
  "error": "An account with this email already exists"
}
```

## `POST /api/users/login`

Authenticate an existing account using email and password.

### Request

`Content-Type: application/json`

```json
{
  "email": "name@rice.edu",
  "password": "secret123"
}
```

### Success response

`200 OK`

```json
{
  "email": "name@rice.edu",
  "userId": "abc12",
  "isPaid": false,
  "emailVerified": true,
  "verificationSentAt": null,
  "verificationPreviewUrl": null,
  "premiumPlan": "free",
  "subscriptionStatus": "inactive",
  "autoRenew": false,
  "currentPeriodEnd": null
}
```

### Error responses

`400 Bad Request`

```json
{
  "error": "Email must be valid"
}
```

`401 Unauthorized`

```json
{
  "error": "Invalid credentials"
}
```

## `POST /api/shorten`

Create a short URL mapping in Bigtable.

### Request

`Content-Type: application/json`

```json
{
  "longUrl": "https://www.rice.edu",
  "userId": "abc12",
  "customCode": "rice539"
}
```

Notes:

- `longUrl` is required and must be a valid `http` or `https` URL.
- `userId` is optional and associates the short URL with an account for dashboard display.
- If `userId` is omitted, the link is created anonymously. In the current frontend prototype, anonymous links created in the same browser session are automatically claimed after signup or login.
- `customCode` is optional and currently reserved for premium users.
- Custom codes must be 4-24 characters using letters, numbers, hyphens, or underscores.

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

`403 Forbidden`

```json
{
  "error": "Premium account required for custom short codes"
}
```

`409 Conflict`

```json
{
  "error": "customCode is already in use"
}
```

`503 Service Unavailable`

```json
{
  "error": "Bigtable is unavailable"
}
```

## `POST /api/users/{email}/subscription/checkout`

Start a premium subscription through the prototype billing flow.

### Request

`Content-Type: application/json`

```json
{
  "planId": "monthly",
  "billingEmail": "name@rice.edu",
  "cardholderName": "Test User",
  "cardNumber": "4242424242424242",
  "expiryMonth": "12",
  "expiryYear": "2027",
  "cvc": "123"
}
```

### Notes

- `planId` must be `monthly` or `annual`.
- The current prototype uses a payment sandbox pattern rather than real billing:
  - `4242424242424242` simulates a successful payment
  - `4000000000000002` simulates a declined payment
- No real card is charged.

### Success response

`200 OK`

```json
{
  "email": "name@rice.edu",
  "userId": "abc12",
  "isPaid": true,
  "emailVerified": true,
  "verificationSentAt": null,
  "verificationPreviewUrl": null,
  "premiumPlan": "monthly",
  "subscriptionStatus": "active",
  "autoRenew": true,
  "currentPeriodEnd": "2026-05-20T16:24:00Z"
}
```

### Error responses

`402 Payment Required`

```json
{
  "error": "Test payment was declined"
}
```

`402 Payment Required`

```json
{
  "error": "Use the prototype test card 4242 4242 4242 4242 to simulate a successful payment"
}
```

## `POST /api/users/{email}/subscription/cancel`

Turn off premium auto-renew while leaving premium active through the current billing period.

### Success response

`200 OK`

```json
{
  "email": "name@rice.edu",
  "userId": "abc12",
  "isPaid": true,
  "emailVerified": true,
  "verificationSentAt": null,
  "verificationPreviewUrl": null,
  "premiumPlan": "monthly",
  "subscriptionStatus": "canceling",
  "autoRenew": false,
  "currentPeriodEnd": "2026-05-20T16:24:00Z"
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
- For the current prototype, premium is tested through the billing page using payment sandbox test cards, not through a real payment provider.
- Real email verification is future work. The MVP only validates email format and rejects duplicate email registrations.
