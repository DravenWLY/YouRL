package org.yourl.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UrlController.class)
class UrlControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BigTableService bigTableService;

    @Test
    void shortenReturnsJsonResponse() throws Exception {
        Instant createdAt = Instant.parse("2026-04-02T23:15:42.019Z");
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.shortenUrl(Mockito.any(ShortenRequest.class)))
                .thenReturn(new UrlMapping("abc1234", "https://www.rice.edu", "test-user", createdAt, null, true));

        ShortenRequest request = new ShortenRequest("https://www.rice.edu", null, "test-user", null);

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Host", "localhost:8080")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortId").value("abc1234"))
                .andExpect(jsonPath("$.shortUrl").value("http://localhost:8080/abc1234"))
                .andExpect(jsonPath("$.longUrl").value("https://www.rice.edu"))
                .andExpect(jsonPath("$.userId").value("test-user"))
                .andExpect(jsonPath("$.createdAt").value("2026-04-02T23:15:42.019Z"));
    }

    @Test
    void shortenReturnsBadRequestForInvalidUrl() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);

        ShortenRequest request = new ShortenRequest("not-a-url", null, "test-user", null);

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("longUrl must be a valid http or https URL"));
    }

    @Test
    void shortenReturnsBadRequestForPastExpiresAt() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);

        ShortenRequest request = new ShortenRequest(
                "https://www.rice.edu",
                Instant.now().minusSeconds(60),
                "test-user",
                null
        );

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("expiresAt must be in the future"));
    }

    @Test
    void shortenReturnsServiceUnavailableWhenBigtableIsDown() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(false);

        ShortenRequest request = new ShortenRequest("https://www.rice.edu", null, "test-user", null);

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("Bigtable is unavailable"));
    }

    @Test
    void resolveReturnsRedirectWhenShortCodeExists() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.resolveUrl("abc1234"))
                .thenReturn(new UrlMapping(
                        "abc1234",
                        "https://www.rice.edu",
                        "test-user",
                        Instant.parse("2026-04-02T23:15:42.019Z"),
                        null,
                        true));

        mockMvc.perform(get("/abc1234"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://www.rice.edu"));
    }

    @Test
    void resolveReturnsNotFoundWhenShortCodeDoesNotExist() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.resolveUrl("missing1")).thenReturn(null);

        mockMvc.perform(get("/missing1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void resolveReturnsNotFoundWhenExpiredLinkIsFilteredByService() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.resolveUrl("expired1")).thenReturn(null);

        mockMvc.perform(get("/expired1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void resolveReturnsNotFoundWhenInactiveLinkIsFilteredByService() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.resolveUrl("inactive1")).thenReturn(null);

        mockMvc.perform(get("/inactive1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void claimUrlsReturnsClaimedCount() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.claimUrlsForUser(Mockito.eq("user-1"), Mockito.anyList()))
                .thenReturn(2);

        ClaimUrlsRequest request = new ClaimUrlsRequest("user-1", java.util.List.of("abc1234", "def5678"));

        mockMvc.perform(post("/api/urls/claim")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.claimedCount").value(2));
    }

    @Test
    void claimUrlsReturnsBadRequestForMissingShortIds() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);

        ClaimUrlsRequest request = new ClaimUrlsRequest("user-1", java.util.List.of());

        mockMvc.perform(post("/api/urls/claim")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("shortIds is required"));
    }

    @Test
    void shortenRejectsCustomCodeForFreeUsers() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.getUserById("free-user"))
                .thenReturn(new UserAccount("free@example.com", "free-user", "secret123", false, true, null, null, "free", "inactive", false, null));

        ShortenRequest request = new ShortenRequest("https://www.rice.edu", null, "free-user", "rice2026");

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Premium account required for custom short codes"));
    }

    @Test
    void shortenAcceptsCustomCodeForPremiumUsers() throws Exception {
        Instant createdAt = Instant.parse("2026-04-02T23:15:42.019Z");
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.getUserById("paid-user"))
                .thenReturn(new UserAccount("paid@example.com", "paid-user", "secret123", true, true, null, null, "monthly", "active", true, null));
        Mockito.when(bigTableService.shortCodeExists("rice2026")).thenReturn(false);
        Mockito.when(bigTableService.shortenUrl(Mockito.any(ShortenRequest.class)))
                .thenReturn(new UrlMapping("rice2026", "https://www.rice.edu", "paid-user", createdAt, null, true));

        ShortenRequest request = new ShortenRequest("https://www.rice.edu", null, "paid-user", "rice2026");

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Host", "localhost:8080")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortId").value("rice2026"))
                .andExpect(jsonPath("$.shortUrl").value("http://localhost:8080/rice2026"));
    }

    @Test
    void shortenRejectsCustomCodeConflict() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.getUserById("paid-user"))
                .thenReturn(new UserAccount("paid@example.com", "paid-user", "secret123", true, true, null, null, "monthly", "active", true, null));
        Mockito.when(bigTableService.shortCodeExists("rice2026")).thenReturn(true);

        ShortenRequest request = new ShortenRequest("https://www.rice.edu", null, "paid-user", "rice2026");

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("customCode is already in use"));
    }
}
