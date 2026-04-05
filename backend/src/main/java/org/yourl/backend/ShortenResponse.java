package org.yourl.backend;

import java.time.Instant;

public record ShortenResponse(
        String shortId,
        String shortUrl,
        String longUrl,
        Instant createdAt,
        Instant expiresAt,
        String userId,
) {
}
