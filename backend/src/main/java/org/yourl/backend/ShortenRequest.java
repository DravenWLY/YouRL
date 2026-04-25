package org.yourl.backend;

import java.time.Instant;

public record ShortenRequest(String longUrl, Instant expiresAt, String userId, String customCode) {
}
