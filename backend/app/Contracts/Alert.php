<?php

namespace App\Contracts;

use App\Enums\AlertSeverity;

/** One alert for the on-call person: a stable key to group repeats by, and a line a person can act on. */
final class Alert
{
    /** @param  array<string, scalar|null>  $context */
    public function __construct(
        public readonly string $key,
        public readonly string $summary,
        public readonly AlertSeverity $severity,
        public readonly array $context = [],
    ) {}
}
