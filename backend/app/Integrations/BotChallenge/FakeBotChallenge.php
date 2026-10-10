<?php

namespace App\Integrations\BotChallenge;

use App\Contracts\BotChallenge;
use App\Contracts\BotChallengeUnavailable;

/**
 * Deterministic bot challenge for development and tests (ADR-0002): every token passes except `fail`.
 * `unreachable` stands in for a provider that does not answer (M2 D3).
 */
class FakeBotChallenge implements BotChallenge
{
    public const FAILING_TOKEN = 'fail';

    public function __construct(private readonly bool $unreachable = false) {}

    public function passes(string $token, ?string $ip, string $action): bool
    {
        if ($this->unreachable) {
            throw new BotChallengeUnavailable('The fake bot challenge provider is set to be unreachable.');
        }

        return $token !== self::FAILING_TOKEN;
    }
}
