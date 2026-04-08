package org.yourl.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.List;

@RestController
public class UrlController {
    private final BigTableService bigTableService;

    public UrlController(BigTableService bigTableService) {
        this.bigTableService = bigTableService;
    }

    // API Method a: shorten_url
    @PostMapping(path = "/api/shorten", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> shorten(@RequestBody ShortenRequest request) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Bigtable is unavailable"));
        }

        if (request == null || request.longUrl() == null || request.longUrl().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("longUrl is required"));
        }

        if (!isValidHttpUrl(request.longUrl())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("longUrl must be a valid http or https URL"));
        }

        Instant expiresAt = request.expiresAt();
        if (expiresAt != null && !expiresAt.isAfter(Instant.now())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("expiresAt must be in the future"));
        }

        UrlMapping mapping = bigTableService.shortenUrl(request); // Note: we pass the whole request now

        // Including mapping.userId() in the response constructor
        return ResponseEntity.ok(new ShortenResponse(
                mapping.shortId(),
                buildShortUrl(mapping.shortId()),
                mapping.longUrl(),
                mapping.userId(), // Added this line
                mapping.createdAt(),
                mapping.expiresAt()
        ));
    }

    @GetMapping(path = "/api/urls", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> listUserUrls(@RequestParam String userId) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Bigtable is unavailable"));
        }

        if (userId == null || userId.isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("userId is required"));
        }

        List<UserUrlSummaryResponse> responses = bigTableService.listUrlsForUser(userId).stream()
                .map(summary -> new UserUrlSummaryResponse(
                        summary.shortId(),
                        buildShortUrl(summary.shortId()),
                        summary.longUrl(),
                        summary.createdAt(),
                        summary.clickCount(),
                        summary.lastAccessTs(),
                        summary.active()
                ))
                .toList();

        return ResponseEntity.ok(responses);
    }

    @PostMapping(path = "/api/urls/claim", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> claimAnonymousUrls(@RequestBody ClaimUrlsRequest request) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("Bigtable is unavailable"));
        }

        if (request == null || request.userId() == null || request.userId().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("userId is required"));
        }

        if (request.shortIds() == null || request.shortIds().isEmpty()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("shortIds is required"));
        }

        int claimedCount = bigTableService.claimUrlsForUser(request.userId(), request.shortIds());
        return ResponseEntity.ok(new ClaimUrlsResponse(claimedCount));
    }

    // API Method b: resolve_url
    // FIX: Added ":[^.]+" to the path variable. 
    // This regex means "match only if there are NO dots". 
    // So "abc1234" matches, but "index.html" is ignored and falls through to the static folder.
    @GetMapping("/{shortId:[^.]+}") 
    public ResponseEntity<Void> resolve(@PathVariable String shortId) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }

        UrlMapping mapping = bigTableService.resolveUrl(shortId);
        if (mapping != null) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(mapping.longUrl()))
                    .build();
        }
        return ResponseEntity.notFound().build();
    }

    private boolean isValidHttpUrl(String rawUrl) {
        try {
            URI uri = new URI(rawUrl);
            return uri.getHost() != null
                    && uri.getScheme() != null
                    && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()));
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private String buildShortUrl(String shortId) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/{shortId}")
                .buildAndExpand(shortId)
                .toUriString();
    }
}
