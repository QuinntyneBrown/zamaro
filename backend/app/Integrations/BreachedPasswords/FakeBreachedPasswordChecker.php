<?php

namespace App\Integrations\BreachedPasswords;

use App\Contracts\BreachedPasswordChecker;

/**
 * Deterministic breach check for development and tests (ADR-0002): a password is breached when it is
 * on `zamaro.fakes.breached_passwords`.
 */
class FakeBreachedPasswordChecker implements BreachedPasswordChecker
{
    public function isBreached(string $password): bool
    {
        return in_array($password, config('zamaro.fakes.breached_passwords'), true);
    }
}
