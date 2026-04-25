package org.yourl.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private static final String EMAIL_REGEX = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
    private static final String TEST_SUCCESS_CARD = "4242424242424242";
    private static final String TEST_DECLINE_CARD = "4000000000000002";

    private final BigTableService bigTableService;

    public UserController(BigTableService bigTableService) {
        this.bigTableService = bigTableService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody AuthRequests.SignupRequest request) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse("Bigtable is unavailable"));
        }
        if (request == null || request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email is required"));
        }
        if (!isValidEmail(request.email())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email must be valid"));
        }
        try {
            UserAccount user = bigTableService.createUser(request.email().trim().toLowerCase(), request.password());
            return ResponseEntity.ok(toResponse(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequests.LoginRequest request) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse("Bigtable is unavailable"));
        }
        if (request == null || request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email is required"));
        }
        if (!isValidEmail(request.email())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email must be valid"));
        }
        UserAccount user = bigTableService.getUser(request.email().trim().toLowerCase());
        if (user != null && user.password().equals(request.password())) {
            return ResponseEntity.ok(toResponse(user)); // In a real app, return a JWT token here.
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Invalid credentials"));
    }

    @PutMapping("/{email}/password")
    public ResponseEntity<?> changePassword(@PathVariable String email, @RequestBody AuthRequests.PasswordChangeRequest request) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse("Bigtable is unavailable"));
        }
        String normalizedEmail = normalizeEmail(email);
        if (!isValidEmail(normalizedEmail)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email must be valid"));
        }
        UserAccount user = bigTableService.getUser(normalizedEmail);
        if (user != null && user.password().equals(request.oldPassword())) {
            UserAccount updatedUser = new UserAccount(
                    user.email(),
                    user.userId(),
                    request.newPassword(),
                    user.isPaid(),
                    user.emailVerified(),
                    user.verificationToken(),
                    user.verificationSentAt(),
                    user.premiumPlan(),
                    user.subscriptionStatus(),
                    user.autoRenew(),
                    user.currentPeriodEnd()
            );
            bigTableService.updateUser(updatedUser);
            return ResponseEntity.ok(toResponse(updatedUser));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Invalid credentials"));
    }

    @PostMapping("/{email}/subscription/checkout")
    public ResponseEntity<?> startSubscriptionCheckout(@PathVariable String email, @RequestBody AuthRequests.PremiumCheckoutRequest request) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse("Bigtable is unavailable"));
        }
        String normalizedEmail = normalizeEmail(email);
        if (!isValidEmail(normalizedEmail)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email must be valid"));
        }
        UserAccount user = bigTableService.getUser(normalizedEmail);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if (request == null || request.planId() == null || request.planId().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("planId is required"));
        }
        if (!"monthly".equals(request.planId()) && !"annual".equals(request.planId())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("planId must be monthly or annual"));
        }
        if (request.billingEmail() == null || !normalizedEmail.equals(normalizeEmail(request.billingEmail()))) {
            return ResponseEntity.badRequest().body(new ErrorResponse("billingEmail must match the account email"));
        }
        if (request.cardholderName() == null || request.cardholderName().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("cardholderName is required"));
        }
        if (request.cardNumber() == null || request.cardNumber().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("cardNumber is required"));
        }
        String normalizedCardNumber = request.cardNumber().replaceAll("\\s+", "");
        if (TEST_DECLINE_CARD.equals(normalizedCardNumber)) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(new ErrorResponse("Test payment was declined"));
        }
        if (!TEST_SUCCESS_CARD.equals(normalizedCardNumber)) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(new ErrorResponse("Use the prototype test card 4242 4242 4242 4242 to simulate a successful payment"));
        }
        if (request.expiryMonth() == null || request.expiryYear() == null || request.cvc() == null
                || request.expiryMonth().isBlank() || request.expiryYear().isBlank() || request.cvc().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("expiryMonth, expiryYear, and cvc are required"));
        }

        UserAccount updatedUser = bigTableService.startPremiumSubscription(normalizedEmail, request.planId());
        return ResponseEntity.ok(toResponse(updatedUser));
    }

    @PostMapping("/{email}/subscription/cancel")
    public ResponseEntity<?> cancelSubscription(@PathVariable String email) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse("Bigtable is unavailable"));
        }
        String normalizedEmail = normalizeEmail(email);
        if (!isValidEmail(normalizedEmail)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email must be valid"));
        }
        UserAccount user = bigTableService.getUser(normalizedEmail);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if (!user.isPaid()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("No active premium subscription to cancel"));
        }
        UserAccount updatedUser = bigTableService.cancelPremiumSubscription(normalizedEmail);
        return ResponseEntity.ok(toResponse(updatedUser));
    }

    @DeleteMapping("/{email}")
    public ResponseEntity<?> deleteAccount(@PathVariable String email) {
        if (!bigTableService.isAvailable()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse("Bigtable is unavailable"));
        }
        String normalizedEmail = normalizeEmail(email);
        if (!isValidEmail(normalizedEmail)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email must be valid"));
        }
        if (bigTableService.getUser(normalizedEmail) == null) {
            return ResponseEntity.notFound().build();
        }
        bigTableService.deleteUser(normalizedEmail);
        return ResponseEntity.ok().build();
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches(EMAIL_REGEX);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private UserAccountResponse toResponse(UserAccount user) {
        return UserAccountResponse.from(user, null);
    }
}
