<?php

namespace App\Jobs\Administration;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

/**
 * Deletes audit entries older than 2 years (L2-069.3), 1,000 at a time, as the retention role: the
 * one role the append-only trigger lets delete (ADR-0022). Each batch is its own transaction, so a
 * run that stops leaves nothing half done, and running it again deletes only what is now due (L2-092).
 */
class PruneAuditEntries implements ShouldQueue
{
    use Queueable;

    public const RETAIN_YEARS = 2;

    public const BATCH = 1000;

    public int $tries = 5;

    /** Deletes what is due and answers how many entries went. */
    public function handle(): int
    {
        $cutoff = now()->subYears(self::RETAIN_YEARS)->toIso8601String();
        $deleted = 0;
        do {
            $batch = DB::transaction(function () use ($cutoff): int {
                DB::statement('SET LOCAL ROLE zamaro_audit_retention');
                $count = DB::affectingStatement(
                    'DELETE FROM audit_entries WHERE id IN (SELECT id FROM audit_entries WHERE occurred_at < ? ORDER BY id LIMIT ?)',
                    [$cutoff, self::BATCH],
                );
                DB::statement('RESET ROLE');

                return $count;
            });
            $deleted += $batch;
        } while ($batch === self::BATCH);

        return $deleted;
    }
}
