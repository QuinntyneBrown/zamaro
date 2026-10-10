<?php

namespace App\Actions\Audit;

use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Models\AuditEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Appends one entry to the audit log (administration/record-audit-log, L2-069). Called inside a
 * business transaction, it commits or rolls back with the change it describes. The time comes from
 * the database clock; the address from the current request, or none for a queued job.
 */
class RecordAuditEntry
{
    /**
     * @param  array<string, mixed>  $context  never a password, token or session ID
     */
    public function handle(?User $actor, AuditAction $action, ?Model $target, AuditOutcome $outcome, array $context = []): AuditEntry
    {
        $request = app()->runningInConsole() && ! app()->runningUnitTests() ? null : request();

        return AuditEntry::create([
            'actor_id' => $actor?->id,
            'actor_role' => $actor?->roleNames()[0]->value ?? null,
            'action' => $action,
            'target_type' => $target?->getMorphClass(),
            'target_id' => $target?->getKey(),
            'ip_address' => $request?->ip(),
            'outcome' => $outcome,
            'context' => $context,
        ]);
    }
}
