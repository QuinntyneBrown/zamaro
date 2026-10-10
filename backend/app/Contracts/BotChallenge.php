<?php

namespace App\Contracts;

/**
 * Checks a bot challenge token with the provider (L2-077.4). The vendor is chosen in M10; until then
 * FakeBotChallenge is bound (ADR-0002, M2 D2).
 */
interface BotChallenge
{
    /**
     * Whether the single-use token proves a person submitted the form `$action` from `$ip`.
     *
     * @throws BotChallengeUnavailable when the provider cannot be reached
     */
    public function passes(string $token, ?string $ip, string $action): bool;
}
