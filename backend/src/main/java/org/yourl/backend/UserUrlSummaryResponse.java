package org.yourl.backend;

import java.time.Instant;

public record UserUrlSummaryResponse(
        String shortId,
        String shortUrl,
        String longUrl,
        Instant createdAt,
        long clickCount,
        Instant lastAccessTs,
        boolean active
) {
}
