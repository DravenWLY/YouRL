package org.yourl.backend;
public class AuthRequests {
    public record SignupRequest(String email, String password) {}
    public record LoginRequest(String email, String password) {}
    public record PasswordChangeRequest(String oldPassword, String newPassword) {}
    public record PremiumCheckoutRequest(
            String planId,
            String billingEmail,
            String cardholderName,
            String cardNumber,
            String expiryMonth,
            String expiryYear,
            String cvc
    ) {}
}
