package org.yourl.backend;

import java.time.Instant;

public record UrlMapping(
        String shortId,
        String longUrl,
        Instant createdAt,
        Instant expiresAt,
        boolean active
) {
}
