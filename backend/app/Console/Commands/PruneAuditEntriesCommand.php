<?php

namespace App\Console\Commands;

use App\Jobs\Administration\PruneAuditEntries;
use Illuminate\Console\Command;

/** `audit:prune`: the daily retention run (administration/record-audit-log, M3 D14). */
class PruneAuditEntriesCommand extends Command
{
    protected $signature = 'audit:prune';

    protected $description = 'Delete audit entries older than 2 years, as the retention role';

    public function handle(PruneAuditEntries $prune): int
    {
        $deleted = $prune->handle();
        $this->info("Deleted {$deleted} audit entries older than ".PruneAuditEntries::RETAIN_YEARS.' years.');

        return self::SUCCESS;
    }
}
