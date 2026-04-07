package org.yourl.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for the Caffeine resolve-path cache in BigTableService.
 *
 * Strategy: anonymous subclass overrides isAvailable() and fetchFromBigtable()
 * so no real Bigtable connection (or Mockito) is needed.
 */
class ResolveCacheTest {

    private static final UrlMapping VALID_MAPPING = new UrlMapping(
            "abc1234", "https://example.com",
            Instant.parse("2026-01-01T00:00:00Z"),
            null, true);

    // Controls what fetchFromBigtable() returns in each test
    private UrlMapping bigtableResult;

    // Counts how many times Bigtable was actually consulted
    private int bigtableCallCount;

    private BigTableService service;

    @BeforeEach
    void setUp() {
        bigtableResult = null;
        bigtableCallCount = 0;

        service = new BigTableService(new BigtableProperties(), new CacheProperties()) {
            @Override
            public boolean isAvailable() {
                return true;
            }

            @Override
            UrlMapping fetchFromBigtable(String shortId) {
                bigtableCallCount++;
                return bigtableResult;
            }
        };
    }

    @Test
    void missPopulatesCacheThenHitSkipsBigtable() {
        bigtableResult = VALID_MAPPING;

        UrlMapping first = service.resolveUrl("abc1234");
        UrlMapping second = service.resolveUrl("abc1234");

        assertNotNull(first);
        assertSame(first, second, "second call should return the cached instance");
        assertEquals(1, bigtableCallCount, "Bigtable should be read only once");
    }

    @Test
    void missingUrlNotCached() {
        bigtableResult = null;

        assertNull(service.resolveUrl("missing"));
        assertNull(service.resolveUrl("missing"));

        assertEquals(2, bigtableCallCount, "missing shortId should never be cached");
    }

    @Test
    void expiredUrlNotCached() {
        // fetchFromBigtable already filters expired links and returns null
        bigtableResult = null;

        assertNull(service.resolveUrl("expired1"));
        assertNull(service.resolveUrl("expired1"));

        assertEquals(2, bigtableCallCount, "expired result (null) should not be cached");
    }

    @Test
    void inactiveUrlNotCached() {
        // fetchFromBigtable already filters inactive links and returns null
        bigtableResult = null;

        assertNull(service.resolveUrl("inactive1"));
        assertNull(service.resolveUrl("inactive1"));

        assertEquals(2, bigtableCallCount, "inactive result (null) should not be cached");
    }

    @Test
    void differentShortIdsCachedIndependently() {
        bigtableResult = VALID_MAPPING;
        service.resolveUrl("abc1234");
        service.resolveUrl("abc1234"); // cache hit

        UrlMapping other = new UrlMapping(
                "xyz9999", "https://other.com",
                Instant.parse("2026-01-01T00:00:00Z"),
                null, true);
        bigtableResult = other;
        service.resolveUrl("xyz9999");
        service.resolveUrl("xyz9999"); // cache hit

        assertEquals(2, bigtableCallCount,
                "each distinct shortId should cause exactly one Bigtable read");
    }
}
