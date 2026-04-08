package org.yourl.backend;

public record UserAccountResponse(String username, String userId, boolean isPaid) {
    public static UserAccountResponse from(UserAccount account) {
        return new UserAccountResponse(account.username(), account.userId(), account.isPaid());
    }
}
