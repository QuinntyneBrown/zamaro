<?php

namespace App\Services\Operations\Readiness;

final class CheckResult
{
    public function __construct(
        public readonly string $name,
        public readonly bool $ok,
        public readonly int $durationMs,
    ) {}
}
