package org.yourl.backend;

import com.google.cloud.bigtable.admin.v2.BigtableTableAdminClient;
import com.google.cloud.bigtable.admin.v2.models.CreateTableRequest;
import com.google.cloud.bigtable.data.v2.BigtableDataClient;
import com.google.cloud.bigtable.data.v2.models.Row;
import com.google.cloud.bigtable.data.v2.models.RowMutation;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.io.IOException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;

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
            // 1. Initialize the Admin Client to manage tables
            try (BigtableTableAdminClient adminClient = BigtableTableAdminClient.create(
                    properties.getProjectId(),
                    properties.getInstanceId()
            )) {
                // Initialize Links Table
                if (!adminClient.exists(properties.getTableId())) {
                    adminClient.createTable(CreateTableRequest.of(properties.getTableId())
                            .addFamily(properties.getMetaFamily()));
                }
                
                // Initialize Users Table
                if (!adminClient.exists(properties.getUsersTableId())) {
                    adminClient.createTable(CreateTableRequest.of(properties.getUsersTableId())
                            .addFamily(properties.getUserInfoFamily()));
                }
            }

            // 2. Initialize the Data Client
            this.dataClient = BigtableDataClient.create(properties.getProjectId(), properties.getInstanceId());

        } catch (IOException e) {
            logger.error("Failed to initialize Bigtable clients or tables", e);
        }
    }

    public UrlMapping shortenUrl(ShortenRequest request) {
        String shortId = generateShortCode();
        Instant now = Instant.now();
        
        RowMutation mutation = RowMutation.create(properties.getTableId(), shortId)
                .setCell(properties.getMetaFamily(), "long_url", request.longUrl())
                .setCell(properties.getMetaFamily(), "created_at", now.toString())
                .setCell(properties.getMetaFamily(), "is_active", "true");

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
        if (dataClient == null) {
            throw new IllegalStateException("Bigtable is unavailable");
        }

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

    public boolean isAvailable() {
        return dataClient != null;
    }

    private UrlMapping toUrlMapping(String shortId, Row row) {
        String longUrl = readCellAsString(row, properties.getMetaFamily(), "long_url");
        
        //Read the userId from the row
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

    private String generateShortCode() {
        StringBuilder builder = new StringBuilder(properties.getShortCodeLength());
        for (int i = 0; i < properties.getShortCodeLength(); i++) {
            int index = secureRandom.nextInt(SHORT_CODE_ALPHABET.length());
            builder.append(SHORT_CODE_ALPHABET.charAt(index));
        }
        return builder.toString();
    }

    // --- User Management Methods ---
    
    public UserAccount createUser(String username, String password) {
        if (getUser(username) != null) {
            throw new IllegalArgumentException("Username already exists");
        }
        
        String userId = generateUserId();
        RowMutation mutation = RowMutation.create(properties.getUsersTableId(), username)
                .setCell(properties.getUserInfoFamily(), "user_id", userId)
                .setCell(properties.getUserInfoFamily(), "password", password) // Note: In production, hash this!
                .setCell(properties.getUserInfoFamily(), "is_paid", "false");
                
        dataClient.mutateRow(mutation);
        return new UserAccount(username, userId, password, false);
    }

    public UserAccount getUser(String username) {
        Row row = dataClient.readRow(properties.getUsersTableId(), username);
        if (row == null) return null;
        
        String userId = readCellAsString(row, properties.getUserInfoFamily(), "user_id");
        String password = readCellAsString(row, properties.getUserInfoFamily(), "password");
        boolean isPaid = Boolean.parseBoolean(readCellAsString(row, properties.getUserInfoFamily(), "is_paid"));
        
        return new UserAccount(username, userId, password, isPaid);
    }

    public void updateUser(UserAccount user) {
        RowMutation mutation = RowMutation.create(properties.getUsersTableId(), user.username())
                .setCell(properties.getUserInfoFamily(), "password", user.password())
                .setCell(properties.getUserInfoFamily(), "is_paid", String.valueOf(user.isPaid()));
        dataClient.mutateRow(mutation);
    }

    public void deleteUser(String username) {
        RowMutation mutation = RowMutation.create(properties.getUsersTableId(), username).deleteRow();
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
}
