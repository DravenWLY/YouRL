package org.yourl.backend;
public class AuthRequests {
    public record SignupRequest(String username, String password) {}
    public record LoginRequest(String username, String password) {}
    public record PasswordChangeRequest(String oldPassword, String newPassword) {}
}