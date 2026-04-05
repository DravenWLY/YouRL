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
        //Updated mock to expect a ShortenRequest object instead of a String, and return the updated UrlMapping
        Mockito.when(bigTableService.shortenUrl(Mockito.any(ShortenRequest.class)))
                .thenReturn(new UrlMapping("abc1234", "https://www.rice.edu", "test-user", createdAt, null, true));

        //Added "test-user" as the third argument for the userId
        ShortenRequest request = new ShortenRequest("https://www.rice.edu", null, "test-user");

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Host", "localhost:8080")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortId").value("abc1234"))
                .andExpect(jsonPath("$.shortUrl").value("http://localhost:8080/abc1234"))
                .andExpect(jsonPath("$.longUrl").value("https://www.rice.edu"))
                .andExpect(jsonPath("$.createdAt").value("2026-04-02T23:15:42.019Z"));
    }

    @Test
    void shortenReturnsBadRequestForInvalidUrl() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);

        // Added "test-user" as the third argument
        ShortenRequest request = new ShortenRequest("not-a-url", null, "test-user");

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("longUrl must be a valid http or https URL"));
    }

    @Test
    void shortenReturnsServiceUnavailableWhenBigtableIsDown() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(false);

        // Added "test-user" as the third argument
        ShortenRequest request = new ShortenRequest("https://www.rice.edu", null, "test-user");

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("Bigtable is unavailable"));
    }

    @Test
    void resolveReturnsRedirectWhenShortCodeExists() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        // Added "test-user" as the third argument in the UrlMapping constructor
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
}