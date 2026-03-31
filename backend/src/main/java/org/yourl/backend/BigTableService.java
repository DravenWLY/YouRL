package org.yourl.backend;

import com.google.cloud.bigtable.admin.v2.BigtableTableAdminClient;
import com.google.cloud.bigtable.admin.v2.models.CreateTableRequest;
import com.google.cloud.bigtable.data.v2.BigtableDataClient;
import com.google.cloud.bigtable.data.v2.models.Row;
import com.google.cloud.bigtable.data.v2.models.RowMutation;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class BigTableService {
    private static final Logger logger = LoggerFactory.getLogger(BigTableService.class);

    private final String projectId = "you-rl-demo";
    private final String instanceId = "you-rl-instance";
    private final String tableId = "links";
    private final String columnFamily = "d";

    private BigtableDataClient dataClient;

    @PostConstruct
    public void init() throws IOException {
        // 1. Initialize the Admin Client to manage tables
        try (BigtableTableAdminClient adminClient = BigtableTableAdminClient.create(projectId, instanceId)) {
            // 2. Create the table if it doesn't exist
            if (!adminClient.exists(tableId)) {
                logger.info("Creating table: {}", tableId);
                adminClient.createTable(CreateTableRequest.of(tableId).addFamily(columnFamily));
            }
        } catch (Exception e) {
            logger.warn("Table setup skipped because Bigtable is unavailable", e);
        }

        // 3. Initialize the Data Client for reading/writing
        try {
            this.dataClient = BigtableDataClient.create(projectId, instanceId);
        } catch (Exception e) {
            logger.warn("Bigtable data client unavailable; starting without URL storage", e);
            this.dataClient = null;
        }
    }

    public boolean isAvailable() {
        return dataClient != null;
    }

    public String shortenUrl(String longUrl) {
        if (dataClient == null) {
            throw new IllegalStateException("Bigtable is unavailable");
        }
        String shortId = UUID.randomUUID().toString().substring(0, 7);
        RowMutation mutation = RowMutation.create(tableId, shortId)
                .setCell(columnFamily, "url", longUrl);
        dataClient.mutateRow(mutation);
        return shortId;
    }

    public String resolveUrl(String shortId) {
        if (dataClient == null) {
            throw new IllegalStateException("Bigtable is unavailable");
        }
        Row row = dataClient.readRow(tableId, shortId);
        if (row != null) {
            return row.getCells(columnFamily, "url").get(0).getValue().toStringUtf8();
        }
        return null;
    }
}
