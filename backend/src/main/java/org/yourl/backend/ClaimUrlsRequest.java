package org.yourl.backend;

import java.util.List;

public record ClaimUrlsRequest(String userId, List<String> shortIds) {
}
