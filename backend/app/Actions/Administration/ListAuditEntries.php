<?php

namespace App\Actions\Administration;

use App\Models\Artist;
use App\Models\AuditEntry;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\Cursor;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * The audit log as the admin viewer reads it (administration/record-audit-log, L2-069): newest
 * first, 50 at a time by cursor, narrowed by actor email, action, target, outcome and a date range in
 * Toronto time. Reading only: nothing here changes or deletes an entry (L2-069.2).
 */
class ListAuditEntries
{
    public const PER_PAGE = 50;

    /**
     * @param  array{actor?: ?string, action?: ?string, target?: ?string, outcome?: ?string, from?: ?string, to?: ?string}  $filters
     */
    public function handle(array $filters, ?Cursor $cursor): CursorPaginator
    {
        $query = AuditEntry::query()->with(['actor', 'target']);

        if (filled($filters['actor'] ?? null)) {
            $query->whereIn('actor_id', User::whereRaw('lower(email) = ?', [Str::lower(trim($filters['actor']))])->select('id'));
        }
        if (filled($filters['action'] ?? null)) {
            $query->where('action', $filters['action']);
        }
        if (filled($filters['outcome'] ?? null)) {
            $query->where('outcome', $filters['outcome']);
        }
        if (filled($filters['target'] ?? null)) {
            $this->whereTargetMatches($query, trim($filters['target']));
        }
        $timezone = config('app.timezone');
        if (filled($filters['from'] ?? null)) {
            $query->where('occurred_at', '>=', Carbon::parse($filters['from'], $timezone)->startOfDay()->toIso8601String());
        }
        if (filled($filters['to'] ?? null)) {
            $query->where('occurred_at', '<=', Carbon::parse($filters['to'], $timezone)->endOfDay()->toIso8601String());
        }

        return $query->orderByDesc('occurred_at')->orderByDesc('id')->cursorPaginate(self::PER_PAGE, cursor: $cursor);
    }

    /** A booking by its number, or an artist or user whose name (or a user's email) contains the text. */
    private function whereTargetMatches(Builder $query, string $text): void
    {
        $like = '%'.addcslashes(Str::lower($text), '%_\\').'%';
        $query->where(function (Builder $target) use ($like) {
            $target->where(fn (Builder $q) => $q->where('target_type', (new Booking)->getMorphClass())
                ->whereIn('target_id', Booking::whereRaw('lower(number) like ?', [$like])->select('id')))
                ->orWhere(fn (Builder $q) => $q->where('target_type', (new Artist)->getMorphClass())
                    ->whereIn('target_id', Artist::whereRaw('lower(display_name) like ?', [$like])->select('id')))
                ->orWhere(fn (Builder $q) => $q->where('target_type', (new User)->getMorphClass())
                    ->whereIn('target_id', User::whereRaw('lower(name) like ? or lower(email) like ?', [$like, $like])->select('id')));
        });
    }
}
