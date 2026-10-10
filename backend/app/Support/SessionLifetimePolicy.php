<?php

namespace App\Support;

use App\Models\User;

/**
 * How long a session may live (L2-073.3): 7 days without a request, and 30 days from sign-in
 * however active. The idle limit is the session lifetime in config/session.php, which Redis applies
 * as the key's expiry; the absolute limit is enforced by EnforceAbsoluteSessionLifetime. The
 * administrator's 30-minute idle limit joins with M3 (L2-066).
 */
final class SessionLifetimePolicy
{
    public const IDLE_MINUTES = 10080;

    public const ABSOLUTE_MINUTES = 43200;

    /** Minutes from sign-in after which this person's session ends, whatever they do. */
    public function absoluteMinutes(User $user): int
    {
        return self::ABSOLUTE_MINUTES;
    }

    /** Whether a session that started at `$startedAt` (a Unix time) has reached its absolute limit. */
    public function hasExpired(User $user, ?int $startedAt): bool
    {
        // A session with no start time predates the rule; it is ended rather than trusted.
        return $startedAt === null || now()->getTimestamp() - $startedAt >= $this->absoluteMinutes($user) * 60;
    }
}
