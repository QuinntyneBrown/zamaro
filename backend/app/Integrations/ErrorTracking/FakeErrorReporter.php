<?php

namespace App\Integrations\ErrorTracking;

use App\Contracts\ErrorReporter;
use App\Logging\RedactSensitiveData;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Error tracking for development and tests (ADR-0002): each report is redacted as a log line would be,
 * kept in memory for tests to read, and written to the log.
 */
class FakeErrorReporter implements ErrorReporter
{
    /** @var list<array{exception: Throwable, requestId: ?string, release: string, context: array<string, mixed>}> */
    public array $reports = [];

    public function report(Throwable $e, ?string $requestId, string $release, array $context = []): void
    {
        $context = (new RedactSensitiveData)->redact($context);
        $this->reports[] = ['exception' => $e, 'requestId' => $requestId, 'release' => $release, 'context' => $context];

        Log::error('Error reported: '.$e::class, [
            'error' => $e->getMessage(),
            'request_id' => $requestId,
            'release' => $release,
            ...$context,
        ]);
    }
}
