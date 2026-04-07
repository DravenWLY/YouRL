package org.yourl.backend;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.google.cloud.bigtable.admin.v2.BigtableTableAdminClient;
import com.google.cloud.bigtable.admin.v2.models.CreateTableRequest;
import com.google.cloud.bigtable.data.v2.BigtableDataClient;
import com.google.cloud.bigtable.data.v2.models.Row;
import com.google.cloud.bigtable.data.v2.models.RowMutation;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class BigTableService {
    private static final Logger logger = LoggerFactory.getLogger(BigTableService.class);
    private static final String SHORT_CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    private final BigtableProperties properties;
    private final Cache<String, UrlMapping> resolveCache;
    private final SecureRandom secureRandom = new SecureRandom();

    private BigtableDataClient dataClient;

    public BigTableService(BigtableProperties properties, CacheProperties cacheProperties) {
        this.properties = properties;
        this.resolveCache = Caffeine.newBuilder()
                .maximumSize(cacheProperties.getMaxSize())
                .expireAfterWrite(cacheProperties.getTtlSeconds(), TimeUnit.SECONDS)
                .build();
    }

    @PostConstruct
    public void init() {
        // 1. Initialize the Admin Client to manage tables
        try (BigtableTableAdminClient adminClient = BigtableTableAdminClient.create(
                properties.getProjectId(),
                properties.getInstanceId()
        )) {
            // 2. Create the table if it doesn't exist
            if (!adminClient.exists(properties.getTableId())) {
                logger.info("Creating table: {}", properties.getTableId());
                adminClient.createTable(CreateTableRequest.of(properties.getTableId())
                        .addFamily(properties.getMetaFamily())
                        .addFamily(properties.getStatsFamily()));
            }
        } catch (Exception e) {
            logger.warn("Table setup skipped because Bigtable is unavailable", e);
        }

        // 3. Initialize the Data Client for reading/writing
        try {
            this.dataClient = BigtableDataClient.create(
                    properties.getProjectId(),
                    properties.getInstanceId()
            );
        } catch (Exception e) {
            logger.warn("Bigtable data client unavailable; starting without URL storage", e);
            this.dataClient = null;
        }
    }

    public boolean isAvailable() {
        return dataClient != null;
    }

    public UrlMapping shortenUrl(String longUrl, Instant expiresAt) {
        if (dataClient == null) {
            throw new IllegalStateException("Bigtable is unavailable");
        }

        Instant createdAt = Instant.now();
        for (int attempt = 0; attempt < properties.getMaxGenerationAttempts(); attempt++) {
            String shortId = generateShortCode();
            if (dataClient.readRow(properties.getTableId(), shortId) != null) {
                continue;
            }

            RowMutation mutation = RowMutation.create(properties.getTableId(), shortId)
                    .setCell(properties.getMetaFamily(), "long_url", longUrl)
                    .setCell(properties.getMetaFamily(), "created_at", createdAt.toString())
                    .setCell(properties.getMetaFamily(), "is_active", Boolean.TRUE.toString())
                    .setCell(properties.getStatsFamily(), "click_count", "0");

            if (expiresAt != null) {
                mutation.setCell(properties.getMetaFamily(), "expires_at", expiresAt.toString());
            }

            dataClient.mutateRow(mutation);
            return new UrlMapping(shortId, longUrl, createdAt, expiresAt, true);
        }

        throw new IllegalStateException("Unable to generate a unique short code after retries");
    }

    public UrlMapping resolveUrl(String shortId) {
        UrlMapping cached = resolveCache.getIfPresent(shortId);
        if (cached != null) {
            return cached;
        }

        if (!isAvailable()) {
            throw new IllegalStateException("Bigtable is unavailable");
        }

        UrlMapping mapping = fetchFromBigtable(shortId);
        if (mapping != null) {
            resolveCache.put(shortId, mapping);
        }
        return mapping;
    }

    // Package-private for testing
    UrlMapping fetchFromBigtable(String shortId) {
        Row row = dataClient.readRow(properties.getTableId(), shortId);
        if (row == null) {
            return null;
        }

        UrlMapping mapping = toUrlMapping(shortId, row);
        if (!mapping.active()) {
            return null;
        }

        if (mapping.expiresAt() != null && !mapping.expiresAt().isAfter(Instant.now())) {
            return null;
        }

        return mapping;
    }

    private UrlMapping toUrlMapping(String shortId, Row row) {
        String longUrl = readCellAsString(row, properties.getMetaFamily(), "long_url");
        Instant createdAt = parseInstant(readCellAsString(row, properties.getMetaFamily(), "created_at"));
        Instant expiresAt = parseInstant(readCellAsString(row, properties.getMetaFamily(), "expires_at"));
        String activeText = readCellAsString(row, properties.getMetaFamily(), "is_active");
        boolean active = activeText == null || Boolean.parseBoolean(activeText);
        return new UrlMapping(shortId, longUrl, createdAt, expiresAt, active);
    }

    private String readCellAsString(Row row, String family, String qualifier) {
        List<com.google.cloud.bigtable.data.v2.models.RowCell> cells = row.getCells(family, qualifier);
        if (cells == null || cells.isEmpty()) {
            return null;
        }
        return cells.get(0).getValue().toStringUtf8();
    }

    private Instant parseInstant(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return Instant.parse(raw);
    }

    private String generateShortCode() {
        StringBuilder builder = new StringBuilder(properties.getShortCodeLength());
        for (int i = 0; i < properties.getShortCodeLength(); i++) {
            int index = secureRandom.nextInt(SHORT_CODE_ALPHABET.length());
            builder.append(SHORT_CODE_ALPHABET.charAt(index));
        }
        return builder.toString();
    }
}
