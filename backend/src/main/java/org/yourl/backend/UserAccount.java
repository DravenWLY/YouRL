package org.yourl.backend;

import java.time.Instant;

public record UserAccount(
        String email,
        String userId,
        String password,
        boolean isPaid,
        boolean emailVerified,
        String verificationToken,
        Instant verificationSentAt,
        String premiumPlan,
        String subscriptionStatus,
        boolean autoRenew,
        Instant currentPeriodEnd
) {}
