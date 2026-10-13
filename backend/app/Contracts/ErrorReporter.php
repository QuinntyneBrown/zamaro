<?php

namespace App\Contracts;

use Throwable;

/**
 * Sends an exception to the error tracking service with the request ID and release version (L2-093.2,
 * operations/monitor-health-and-errors). The vendor is chosen in M10; until then FakeErrorReporter is
 * bound (ADR-0002).
 */
interface ErrorReporter
{
    /**
     * @param  array<string, scalar|null>  $context  what locates the failure, such as the job name; never a
     *                                               request body
     */
    public function report(Throwable $e, ?string $requestId, string $release, array $context = []): void;
}
