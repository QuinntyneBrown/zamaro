<?php

namespace App\Actions\Security;

use Illuminate\Support\Facades\Log;

/**
 * A structured record on the `security` log channel (L2-076.2): the event type and what it concerns.
 * Routing security events to people is M10's (M3 D16).
 */
class RecordSecurityEvent
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function handle(string $event, array $context): void
    {
        Log::channel('security')->warning($event, ['event' => $event, ...$context]);
    }
}
