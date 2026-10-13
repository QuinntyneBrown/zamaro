<?php

namespace App\Actions\Audit;

use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Logging\RedactSensitiveData;
use App\Models\AuditEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Appends one entry to the audit log (administration/record-audit-log, L2-069). Called inside a
 * business transaction, it commits or rolls back with the change it describes. The time comes from
 * the database clock, except on a frozen clock (the e2e API and the tests), where it is the frozen
 * "now" so the viewer shows what the mocks show; the address from the current request as the trusted
 * proxies report it, or none for a queued job. The context is redacted as log lines are, so no secret reaches an entry (L2-079).
 */
class RecordAuditEntry
{
    public function __construct(private readonly RedactSensitiveData $redactor) {}

    /**
     * @param  array<string, mixed>  $context  secrets in it are stored as [REDACTED]
     */
    public function handle(?User $actor, AuditAction $action, ?Model $target, AuditOutcome $outcome, array $context = []): AuditEntry
    {
        $request = app()->runningInConsole() && ! app()->runningUnitTests() ? null : request();

        return AuditEntry::create([
            ...(Carbon::hasTestNow() ? ['occurred_at' => now()->utc()] : []),
            'actor_id' => $actor?->id,
            'actor_role' => $actor?->roleNames()[0]->value ?? null,
            'action' => $action,
            'target_type' => $target?->getMorphClass(),
            'target_id' => $target?->getKey(),
            'ip_address' => $request?->ip(),
            'outcome' => $outcome,
            'context' => $this->redactor->redact($context),
        ]);
    }
}
