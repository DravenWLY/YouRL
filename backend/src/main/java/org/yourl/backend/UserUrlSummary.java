package org.yourl.backend;

import java.time.Instant;

public record UserUrlSummary(
        String shortId,
        String longUrl,
        Instant createdAt,
        long clickCount,
        Instant lastAccessTs,
        boolean active
) {
}
