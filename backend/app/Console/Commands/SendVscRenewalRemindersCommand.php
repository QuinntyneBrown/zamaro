<?php

namespace App\Console\Commands;

use App\Enums\VscStatus;
use App\Models\VulnerableSectorCheck;
use App\Notifications\VscRenewalReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * `vsc:send-renewal-reminders`: the daily run that emails an artist whose verified Vulnerable Sector
 * Check runs out within 60 days (verify-vulnerable-sector-check, L2-049.3). Each check is reminded
 * once: the stamp is set with a conditional update before the email is queued, so a second run and a
 * missed day both come out right (L2-092.2, L2-092.3). A check the artist has already replaced with
 * a newer verified one needs no reminder.
 */
class SendVscRenewalRemindersCommand extends Command
{
    public const WINDOW_DAYS = 60;

    protected $signature = 'vsc:send-renewal-reminders';

    protected $description = 'Email artists whose verified Vulnerable Sector Check runs out within 60 days';

    public function handle(): int
    {
        $today = today();
        $due = VulnerableSectorCheck::query()
            ->where('status', VscStatus::Verified)
            ->whereNull('renewal_reminder_sent_at')
            ->whereBetween('expires_on', [$today->toDateString(), $today->copy()->addDays(self::WINDOW_DAYS)->toDateString()])
            ->whereNotExists(fn (Builder $newer) => $newer
                ->from('vulnerable_sector_checks as newer')
                ->whereColumn('newer.user_id', 'vulnerable_sector_checks.user_id')
                ->where('newer.status', VscStatus::Verified->value)
                ->whereColumn('newer.expires_on', '>', 'vulnerable_sector_checks.expires_on'))
            ->with('user')
            ->orderBy('expires_on')->orderBy('id')
            ->get();

        $sent = 0;
        foreach ($due as $check) {
            $sent += DB::transaction(function () use ($check): int {
                $claimed = VulnerableSectorCheck::whereKey($check->id)->whereNull('renewal_reminder_sent_at')
                    ->update(['renewal_reminder_sent_at' => now()->utc()]);
                if ($claimed === 1) {
                    $check->user->notify(new VscRenewalReminderNotification($check->expires_on));
                }

                return $claimed;
            });
        }

        $this->info(sprintf('Sent %d renewal reminder%s.', $sent, $sent === 1 ? '' : 's'));

        return self::SUCCESS;
    }
}
