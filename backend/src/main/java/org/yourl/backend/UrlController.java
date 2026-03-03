package org.yourl.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;

@RestController
public class UrlController {

    @Autowired
    private BigTableService bigTableService;

    // API Method a: shorten_url
    @PostMapping("/api/shorten")
    public String shorten(@RequestBody String longUrl) {
        return bigTableService.shortenUrl(longUrl);
    }

    // API Method b: resolve_url
    // FIX: Added ":[^.]+" to the path variable. 
    // This regex means "match only if there are NO dots". 
    // So "abc1234" matches, but "index.html" is ignored and falls through to the static folder.
    @GetMapping("/{shortId:[^.]+}") 
    public ResponseEntity<Void> resolve(@PathVariable String shortId) {
        String longUrl = bigTableService.resolveUrl(shortId);
        if (longUrl != null) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(longUrl))
                    .build();
        }
        return ResponseEntity.notFound().build();
    }
}