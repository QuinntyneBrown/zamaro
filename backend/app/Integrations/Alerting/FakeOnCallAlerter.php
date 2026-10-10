<?php

namespace App\Integrations\Alerting;

use App\Contracts\Alert;
use App\Contracts\OnCallAlerter;
use App\Logging\RedactSensitiveData;
use Illuminate\Support\Facades\Log;

/**
 * On-call alerting for development and tests (ADR-0002): each alert is redacted as a log line would be,
 * kept in memory for tests to read, and written to the log.
 */
class FakeOnCallAlerter implements OnCallAlerter
{
    /** @var list<Alert> */
    public array $alerts = [];

    public function raise(Alert $alert): void
    {
        $alert = new Alert($alert->key, $alert->summary, $alert->severity, (new RedactSensitiveData)->redact($alert->context));
        $this->alerts[] = $alert;

        Log::critical("On-call alert: {$alert->summary}", ['alert' => $alert->key, 'severity' => $alert->severity->value, ...$alert->context]);
    }
}
