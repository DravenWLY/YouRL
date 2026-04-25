package org.yourl.backend;

import com.google.cloud.bigtable.admin.v2.BigtableTableAdminClient;
import com.google.cloud.bigtable.admin.v2.models.CreateTableRequest;
import com.google.cloud.bigtable.admin.v2.models.ModifyColumnFamiliesRequest;
import com.google.cloud.bigtable.data.v2.BigtableDataClient;
import com.google.cloud.bigtable.data.v2.models.Row;
import com.google.cloud.bigtable.data.v2.models.RowMutation;
import com.google.cloud.bigtable.data.v2.models.Query;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class BigTableService {
    private static final Logger logger = LoggerFactory.getLogger(BigTableService.class);
    private static final String SHORT_CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    private final BigtableProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    private BigtableDataClient dataClient;

    public BigTableService(BigtableProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    public void init() {
        try {
            try (BigtableTableAdminClient adminClient = BigtableTableAdminClient.create(
                    properties.getProjectId(),
                    properties.getInstanceId()
            )) {
                ensureUrlsTable(adminClient);
                ensureUsersTable(adminClient);
            }
        } catch (Exception e) {
            logger.warn("Could not verify Bigtable tables during startup", e);
        }

        try {
            this.dataClient = BigtableDataClient.create(properties.getProjectId(), properties.getInstanceId());
        } catch (Exception e) {
            logger.error("Bigtable data client unavailable; starting without storage", e);
            this.dataClient = null;
        }
    }

    public UrlMapping shortenUrl(ShortenRequest request) {
        requireAvailability();

        String shortId = request.customCode() != null && !request.customCode().isBlank()
                ? request.customCode()
                : generateUniqueShortCode();
        Instant now = Instant.now();

        RowMutation mutation = RowMutation.create(properties.getTableId(), shortId)
                .setCell(properties.getMetaFamily(), "long_url", request.longUrl())
                .setCell(properties.getMetaFamily(), "created_at", now.toString())
                .setCell(properties.getMetaFamily(), "is_active", "true")
                .setCell(properties.getStatsFamily(), "click_count", "0");

        if (request.expiresAt() != null) {
            mutation.setCell(properties.getMetaFamily(), "expires_at", request.expiresAt().toString());
        }

        if (request.userId() != null) {
            mutation.setCell(properties.getMetaFamily(), "user_id", request.userId());
        }

        dataClient.mutateRow(mutation);

        return new UrlMapping(shortId, request.longUrl(), request.userId(), now, request.expiresAt(), true);
    }

    public UrlMapping resolveUrl(String shortId) {
        requireAvailability();

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

        recordResolveStats(shortId, row);
        return mapping;
    }

    public boolean isAvailable() {
        return dataClient != null;
    }

    public List<UserUrlSummary> listUrlsForUser(String userId) {
        requireAvailability();

        List<UserUrlSummary> summaries = new ArrayList<>();
        for (Row row : dataClient.readRows(Query.create(properties.getTableId()))) {
            String ownerUserId = readCellAsString(row, properties.getMetaFamily(), "user_id");
            if (!userId.equals(ownerUserId)) {
                continue;
            }

            String shortId = row.getKey().toStringUtf8();
            UrlMapping mapping = toUrlMapping(shortId, row);
            long clickCount = parseLongOrZero(readCellAsString(row, properties.getStatsFamily(), "click_count"));
            Instant lastAccessTs = parseInstant(readCellAsString(row, properties.getStatsFamily(), "last_access_ts"));

            summaries.add(new UserUrlSummary(
                    shortId,
                    mapping.longUrl(),
                    mapping.createdAt(),
                    clickCount,
                    lastAccessTs,
                    mapping.active()
            ));
        }

        summaries.sort(Comparator.comparing(
                UserUrlSummary::createdAt,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));
        return summaries;
    }

    public boolean shortCodeExists(String shortCode) {
        requireAvailability();
        return dataClient.readRow(properties.getTableId(), shortCode) != null;
    }

    public int claimUrlsForUser(String userId, List<String> shortIds) {
        requireAvailability();

        if (userId == null || userId.isBlank() || shortIds == null || shortIds.isEmpty()) {
            return 0;
        }

        int claimedCount = 0;
        Set<String> uniqueShortIds = new LinkedHashSet<>(shortIds);
        for (String shortId : uniqueShortIds) {
            if (shortId == null || shortId.isBlank()) {
                continue;
            }

            Row row = dataClient.readRow(properties.getTableId(), shortId);
            if (row == null) {
                continue;
            }

            String existingUserId = readCellAsString(row, properties.getMetaFamily(), "user_id");
            if (existingUserId != null && !existingUserId.isBlank() && !userId.equals(existingUserId)) {
                continue;
            }

            if (userId.equals(existingUserId)) {
                claimedCount++;
                continue;
            }

            RowMutation claimMutation = RowMutation.create(properties.getTableId(), shortId)
                    .setCell(properties.getMetaFamily(), "user_id", userId);
            dataClient.mutateRow(claimMutation);
            claimedCount++;
        }

        return claimedCount;
    }

    private UrlMapping toUrlMapping(String shortId, Row row) {
        String longUrl = readCellAsString(row, properties.getMetaFamily(), "long_url");
        String userId = readCellAsString(row, properties.getMetaFamily(), "user_id");
        Instant createdAt = parseInstant(readCellAsString(row, properties.getMetaFamily(), "created_at"));
        Instant expiresAt = parseInstant(readCellAsString(row, properties.getMetaFamily(), "expires_at"));
        String activeText = readCellAsString(row, properties.getMetaFamily(), "is_active");
        boolean active = activeText == null || Boolean.parseBoolean(activeText);

        return new UrlMapping(shortId, longUrl, userId, createdAt, expiresAt, active);
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

    private long parseLongOrZero(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0L;
        }
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException e) {
            logger.warn("Could not parse numeric Bigtable cell value '{}'", raw, e);
            return 0L;
        }
    }

    private String generateShortCode() {
        StringBuilder builder = new StringBuilder(properties.getShortCodeLength());
        for (int i = 0; i < properties.getShortCodeLength(); i++) {
            int index = secureRandom.nextInt(SHORT_CODE_ALPHABET.length());
            builder.append(SHORT_CODE_ALPHABET.charAt(index));
        }
        return builder.toString();
    }

    // --- User Management Methods ---

    public UserAccount createUser(String email, String password) {
        requireAvailability();
        if (getUser(email) != null) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        String userId = generateUserId();
        String verificationToken = null;
        Instant verificationSentAt = null;
        RowMutation mutation = RowMutation.create(properties.getUsersTableId(), email)
                .setCell(properties.getUserInfoFamily(), "email", email)
                .setCell(properties.getUserInfoFamily(), "user_id", userId)
                .setCell(properties.getUserInfoFamily(), "password", password) // Note: In production, hash this!
                .setCell(properties.getUserInfoFamily(), "is_paid", "false")
                .setCell(properties.getUserInfoFamily(), "email_verified", "true")
                .setCell(properties.getUserInfoFamily(), "verification_sent_at", "")
                .setCell(properties.getUserInfoFamily(), "premium_plan", "free")
                .setCell(properties.getUserInfoFamily(), "subscription_status", "inactive")
                .setCell(properties.getUserInfoFamily(), "auto_renew", "false");

        dataClient.mutateRow(mutation);
        return new UserAccount(email, userId, password, false, true, verificationToken, verificationSentAt, "free", "inactive", false, null);
    }

    public UserAccount getUser(String email) {
        requireAvailability();
        Row row = dataClient.readRow(properties.getUsersTableId(), email);
        if (row == null) return null;

        String userId = readCellAsString(row, properties.getUserInfoFamily(), "user_id");
        String password = readCellAsString(row, properties.getUserInfoFamily(), "password");
        boolean isPaid = Boolean.parseBoolean(readCellAsString(row, properties.getUserInfoFamily(), "is_paid"));
        boolean emailVerified = Boolean.parseBoolean(readCellAsString(row, properties.getUserInfoFamily(), "email_verified"));
        String verificationToken = readCellAsString(row, properties.getUserInfoFamily(), "verification_token");
        Instant verificationSentAt = parseInstant(readCellAsString(row, properties.getUserInfoFamily(), "verification_sent_at"));
        String premiumPlan = defaultIfBlank(readCellAsString(row, properties.getUserInfoFamily(), "premium_plan"), "free");
        String subscriptionStatus = defaultIfBlank(readCellAsString(row, properties.getUserInfoFamily(), "subscription_status"), isPaid ? "active" : "inactive");
        boolean autoRenew = Boolean.parseBoolean(defaultIfBlank(readCellAsString(row, properties.getUserInfoFamily(), "auto_renew"), "false"));
        Instant currentPeriodEnd = parseInstant(readCellAsString(row, properties.getUserInfoFamily(), "current_period_end"));

        return new UserAccount(email, userId, password, isPaid, emailVerified, verificationToken, verificationSentAt, premiumPlan, subscriptionStatus, autoRenew, currentPeriodEnd);
    }

    public UserAccount getUserById(String userId) {
        requireAvailability();
        for (Row row : dataClient.readRows(Query.create(properties.getUsersTableId()))) {
            String storedUserId = readCellAsString(row, properties.getUserInfoFamily(), "user_id");
            if (userId.equals(storedUserId)) {
                String email = row.getKey().toStringUtf8();
                String password = readCellAsString(row, properties.getUserInfoFamily(), "password");
                boolean isPaid = Boolean.parseBoolean(readCellAsString(row, properties.getUserInfoFamily(), "is_paid"));
                boolean emailVerified = Boolean.parseBoolean(readCellAsString(row, properties.getUserInfoFamily(), "email_verified"));
                String verificationToken = readCellAsString(row, properties.getUserInfoFamily(), "verification_token");
                Instant verificationSentAt = parseInstant(readCellAsString(row, properties.getUserInfoFamily(), "verification_sent_at"));
                String premiumPlan = defaultIfBlank(readCellAsString(row, properties.getUserInfoFamily(), "premium_plan"), "free");
                String subscriptionStatus = defaultIfBlank(readCellAsString(row, properties.getUserInfoFamily(), "subscription_status"), isPaid ? "active" : "inactive");
                boolean autoRenew = Boolean.parseBoolean(defaultIfBlank(readCellAsString(row, properties.getUserInfoFamily(), "auto_renew"), "false"));
                Instant currentPeriodEnd = parseInstant(readCellAsString(row, properties.getUserInfoFamily(), "current_period_end"));
                return new UserAccount(email, userId, password, isPaid, emailVerified, verificationToken, verificationSentAt, premiumPlan, subscriptionStatus, autoRenew, currentPeriodEnd);
            }
        }
        return null;
    }

    public void updateUser(UserAccount user) {
        requireAvailability();
        RowMutation mutation = RowMutation.create(properties.getUsersTableId(), user.email())
                .setCell(properties.getUserInfoFamily(), "email", user.email())
                .setCell(properties.getUserInfoFamily(), "password", user.password())
                .setCell(properties.getUserInfoFamily(), "is_paid", String.valueOf(user.isPaid()))
                .setCell(properties.getUserInfoFamily(), "email_verified", String.valueOf(user.emailVerified()))
                .setCell(properties.getUserInfoFamily(), "verification_sent_at", user.verificationSentAt() == null ? "" : user.verificationSentAt().toString())
                .setCell(properties.getUserInfoFamily(), "premium_plan", defaultIfBlank(user.premiumPlan(), "free"))
                .setCell(properties.getUserInfoFamily(), "subscription_status", defaultIfBlank(user.subscriptionStatus(), user.isPaid() ? "active" : "inactive"))
                .setCell(properties.getUserInfoFamily(), "auto_renew", String.valueOf(user.autoRenew()))
                .setCell(properties.getUserInfoFamily(), "current_period_end", user.currentPeriodEnd() == null ? "" : user.currentPeriodEnd().toString());

        if (user.verificationToken() == null || user.verificationToken().isBlank()) {
            mutation.deleteCells(properties.getUserInfoFamily(), "verification_token");
        } else {
            mutation.setCell(properties.getUserInfoFamily(), "verification_token", user.verificationToken());
        }
        dataClient.mutateRow(mutation);
    }

    public void deleteUser(String email) {
        requireAvailability();
        RowMutation mutation = RowMutation.create(properties.getUsersTableId(), email).deleteRow();
        dataClient.mutateRow(mutation);
    }

    private String generateUserId() {
        StringBuilder builder = new StringBuilder(5);
        for (int i = 0; i < 5; i++) {
            builder.append(SHORT_CODE_ALPHABET.charAt(secureRandom.nextInt(SHORT_CODE_ALPHABET.length())));
        }
        // Basic collision check (in a real app, you'd query a reverse index, but this is fine for the prototype)
        return builder.toString();
    }

    private String generateUniqueShortCode() {
        for (int attempt = 0; attempt < properties.getMaxGenerationAttempts(); attempt++) {
            String generated = generateShortCode();
            if (!shortCodeExists(generated)) {
                return generated;
            }
        }
        throw new IllegalStateException("Unable to generate a unique short code");
    }

    private void requireAvailability() {
        if (dataClient == null) {
            throw new IllegalStateException("Bigtable is unavailable");
        }
    }

    private void recordResolveStats(String shortId, Row row) {
        long clickCount = parseLongOrZero(readCellAsString(row, properties.getStatsFamily(), "click_count"));
        Instant now = Instant.now();

        RowMutation statsMutation = RowMutation.create(properties.getTableId(), shortId)
                .setCell(properties.getStatsFamily(), "click_count", Long.toString(clickCount + 1))
                .setCell(properties.getStatsFamily(), "last_access_ts", now.toString());

        dataClient.mutateRow(statsMutation);
    }

    public UserAccount startPremiumSubscription(String email, String planId) {
        requireAvailability();
        UserAccount user = getUser(email);
        if (user == null) {
            return null;
        }

        Instant currentPeriodEnd = "annual".equals(planId)
                ? Instant.now().plusSeconds(365L * 24 * 60 * 60)
                : Instant.now().plusSeconds(30L * 24 * 60 * 60);

        UserAccount updatedUser = new UserAccount(
                user.email(),
                user.userId(),
                user.password(),
                true,
                user.emailVerified(),
                user.verificationToken(),
                user.verificationSentAt(),
                planId,
                "active",
                true,
                currentPeriodEnd
        );
        updateUser(updatedUser);
        return updatedUser;
    }

    public UserAccount cancelPremiumSubscription(String email) {
        requireAvailability();
        UserAccount user = getUser(email);
        if (user == null) {
            return null;
        }

        UserAccount updatedUser = new UserAccount(
                user.email(),
                user.userId(),
                user.password(),
                user.isPaid(),
                user.emailVerified(),
                user.verificationToken(),
                user.verificationSentAt(),
                user.premiumPlan(),
                user.isPaid() ? "canceling" : "inactive",
                false,
                user.currentPeriodEnd()
        );
        updateUser(updatedUser);
        return updatedUser;
    }

    private void ensureUrlsTable(BigtableTableAdminClient adminClient) {
        if (!adminClient.exists(properties.getTableId())) {
            adminClient.createTable(CreateTableRequest.of(properties.getTableId())
                    .addFamily(properties.getMetaFamily())
                    .addFamily(properties.getStatsFamily()));
            return;
        }

        try {
            boolean hasStatsFamily = adminClient.getTable(properties.getTableId())
                    .getColumnFamilies()
                    .stream()
                    .anyMatch(columnFamily -> properties.getStatsFamily().equals(columnFamily.getId()));

            if (!hasStatsFamily) {
                adminClient.modifyFamilies(ModifyColumnFamiliesRequest.of(properties.getTableId())
                        .addFamily(properties.getStatsFamily()));
            }
        } catch (Exception e) {
            logger.warn("Could not ensure stats family exists for table {}", properties.getTableId(), e);
        }
    }

    private void ensureUsersTable(BigtableTableAdminClient adminClient) {
        if (!adminClient.exists(properties.getUsersTableId())) {
            adminClient.createTable(CreateTableRequest.of(properties.getUsersTableId())
                    .addFamily(properties.getUserInfoFamily()));
        }
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
