package org.yourl.backend;

import com.google.cloud.bigtable.data.v2.BigtableDataClient;
import com.google.cloud.bigtable.data.v2.models.Row;
import com.google.cloud.bigtable.data.v2.models.RowMutation;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.UUID;

@Service
public class BigTableService {
    private final BigtableDataClient dataClient;
    private final String tableId = "links";
    private final String columnFamily = "d";

    public BigTableService() throws IOException {
        // The client automatically picks up BIGTABLE_EMULATOR_HOST if set
        this.dataClient = BigtableDataClient.create("you-rl-demo", "you-rl-instance");
    }

    public String shortenUrl(String longUrl) {
        String shortId = UUID.randomUUID().toString().substring(0, 7); // Demo: random 7 chars
        RowMutation mutation = RowMutation.create(tableId, shortId)
                .setCell(columnFamily, "url", longUrl);
        dataClient.mutateRow(mutation);
        return shortId;
    }

    public String resolveUrl(String shortId) {
        Row row = dataClient.readRow(tableId, shortId);
        if (row != null) {
            return row.getCells(columnFamily, "url").get(0).getValue().toStringUtf8();
        }
        return null;
    }
}