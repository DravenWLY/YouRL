package org.yourl.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BigTableService bigTableService;

    @Test
    void signupAcceptsValidEmail() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        UserAccount user = new UserAccount("test@rice.edu", "abc12", "secret123", false, true, null, null, "free", "inactive", false, null);
        Mockito.when(bigTableService.createUser("test@rice.edu", "secret123")).thenReturn(user);

        AuthRequests.SignupRequest request = new AuthRequests.SignupRequest("test@rice.edu", "secret123");

        mockMvc.perform(post("/api/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@rice.edu"))
                .andExpect(jsonPath("$.userId").value("abc12"))
                .andExpect(jsonPath("$.isPaid").value(false));
    }

    @Test
    void signupRejectsInvalidEmail() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);

        AuthRequests.SignupRequest request = new AuthRequests.SignupRequest("not-an-email", "secret123");

        mockMvc.perform(post("/api/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email must be valid"));
    }

    @Test
    void signupRejectsDuplicateEmail() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.createUser("test@rice.edu", "secret123"))
                .thenThrow(new IllegalArgumentException("An account with this email already exists"));

        AuthRequests.SignupRequest request = new AuthRequests.SignupRequest("test@rice.edu", "secret123");

        mockMvc.perform(post("/api/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("An account with this email already exists"));
    }

    @Test
    void loginRejectsInvalidEmail() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);

        AuthRequests.LoginRequest request = new AuthRequests.LoginRequest("not-an-email", "secret123");

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email must be valid"));
    }

    @Test
    void loginReturnsUserForValidCredentials() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.getUser("test@rice.edu"))
                .thenReturn(new UserAccount("test@rice.edu", "abc12", "secret123", true, true, null, null, "monthly", "active", true, null));

        AuthRequests.LoginRequest request = new AuthRequests.LoginRequest("test@rice.edu", "secret123");

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@rice.edu"))
                .andExpect(jsonPath("$.isPaid").value(true));
    }

    @Test
    void checkoutPremiumReturnsPremiumUser() throws Exception {
        Mockito.when(bigTableService.isAvailable()).thenReturn(true);
        Mockito.when(bigTableService.getUser("test@rice.edu"))
                .thenReturn(new UserAccount("test@rice.edu", "abc12", "secret123", false, true, null, null, "free", "inactive", false, null));
        Mockito.when(bigTableService.startPremiumSubscription("test@rice.edu", "monthly"))
                .thenReturn(new UserAccount("test@rice.edu", "abc12", "secret123", true, true, null, null, "monthly", "active", true, null));

        AuthRequests.PremiumCheckoutRequest request = new AuthRequests.PremiumCheckoutRequest(
                "monthly",
                "test@rice.edu",
                "Test User",
                "4242424242424242",
                "12",
                "2030",
                "123"
        );

        mockMvc.perform(post("/api/users/test@rice.edu/subscription/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@rice.edu"))
                .andExpect(jsonPath("$.isPaid").value(true))
                .andExpect(jsonPath("$.premiumPlan").value("monthly"));
    }
}
