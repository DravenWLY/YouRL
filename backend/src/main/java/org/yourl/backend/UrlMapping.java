package org.yourl.backend;

import java.time.Instant;

public record UrlMapping(
        String shortId,
        String longUrl,
        String userId,
        Instant createdAt,
        Instant expiresAt,
        boolean active,
        
) {
}
