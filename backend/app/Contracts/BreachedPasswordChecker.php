<?php

namespace App\Contracts;

/**
 * Whether a password appears in a known data breach (L2-072.1). The real adapter, a k-anonymity range
 * query, lands in M10; until then FakeBreachedPasswordChecker is bound (ADR-0002, M2 D4).
 */
interface BreachedPasswordChecker
{
    public function isBreached(string $password): bool;
}
