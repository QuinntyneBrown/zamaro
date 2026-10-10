<?php

namespace App\Services\ArtistAvailability;

use App\Enums\BookingStatus;
use App\Enums\GatheringKind;
use App\Enums\OverrideState;
use App\Enums\VscStatus;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Free on a date (L2-005): the artist has not marked the date unavailable (a dated override beats the
 * weekly rule) and has no Confirmed booking that day; Requested and Accepted requests do not block.
 * Youth events also need a verified Vulnerable Sector Check still valid on the event date.
 */
class AvailabilityService
{
    /**
     * @param  list<int>  $artistIds
     * @return list<int> the ids among `$artistIds` that are free
     */
    public function freeArtistIds(array $artistIds, CarbonImmutable $date, GatheringKind $kind): array
    {
        if ($artistIds === []) {
            return [];
        }
        $day = $date->toDateString();

        $query = DB::table('artists')
            ->whereIn('artists.id', $artistIds)
            ->leftJoin('availability_overrides as override', function ($join) use ($day) {
                $join->on('override.artist_id', '=', 'artists.id')->where('override.date', $day);
            })
            ->leftJoin('availability_rules as rule', function ($join) use ($date) {
                $join->on('rule.artist_id', '=', 'artists.id')->where('rule.weekday', $date->isoWeekday());
            })
            ->where(function ($query) {
                $query->where('override.state', OverrideState::Free->value)
                    ->orWhere(fn ($query) => $query->whereNull('override.state')->where(
                        fn ($query) => $query->whereNull('rule.unavailable')->orWhere('rule.unavailable', false),
                    ));
            })
            ->whereNotExists(fn ($query) => $query->from('bookings')
                ->whereColumn('bookings.artist_id', 'artists.id')
                ->where('bookings.event_date', $day)
                ->where('bookings.status', BookingStatus::Confirmed->value));

        if ($kind === GatheringKind::YouthEvent) {
            $query->whereExists(fn ($query) => $query->from('vulnerable_sector_checks as check')
                ->whereColumn('check.user_id', 'artists.user_id')
                ->where('check.status', VscStatus::Verified->value)
                ->where('check.expires_on', '>=', $day));
        }

        return $query->pluck('artists.id')->map(fn ($id) => (int) $id)->all();
    }
}
