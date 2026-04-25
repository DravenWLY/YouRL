package org.yourl.backend;

import java.time.Instant;

public record UserAccountResponse(
        String email,
        String userId,
        boolean isPaid,
        boolean emailVerified,
        Instant verificationSentAt,
        String verificationPreviewUrl,
        String premiumPlan,
        String subscriptionStatus,
        boolean autoRenew,
        Instant currentPeriodEnd
) {
    public static UserAccountResponse from(UserAccount account, String verificationPreviewUrl) {
        return new UserAccountResponse(
                account.email(),
                account.userId(),
                account.isPaid(),
                account.emailVerified(),
                account.verificationSentAt(),
                verificationPreviewUrl,
                account.premiumPlan(),
                account.subscriptionStatus(),
                account.autoRenew(),
                account.currentPeriodEnd()
        );
    }
}
