<?php

namespace App\Services\ArtistAvailability;

use App\Enums\BookingStatus;
use App\Enums\GatheringKind;
use App\Enums\OverrideState;
use App\Enums\TourDateStatus;
use App\Enums\VscStatus;
use App\Models\Artist;
use App\Models\AvailabilityOverride;
use App\Models\AvailabilityRule;
use App\Models\Booking;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Free on a date (L2-005): the artist has not marked the date unavailable (a dated override beats the
 * weekly rule) and has no Confirmed booking that day; Requested and Accepted requests do not block.
 * Youth events also need a verified Vulnerable Sector Check still valid on the event date.
 */
class AvailabilityService
{
    /** Free on the date for any kind of gathering but a youth event (the stub's date check, L2-019). */
    public function isFree(Artist $artist, CarbonImmutable $date): bool
    {
        return $this->freeArtistIds([$artist->id], $date) !== [];
    }

    /**
     * The artist's free and booked days from `$from` to `$until`, in date order; days marked
     * unavailable are skipped (L2-017). Reads the weekly rules, the dated overrides and the
     * Confirmed bookings once each, so callers can stop early without a query per day.
     *
     * @return \Generator<int, TourDate>
     */
    public function days(Artist $artist, CarbonImmutable $from, CarbonImmutable $until): \Generator
    {
        $range = [$from->toDateString(), $until->toDateString()];
        $unavailableWeekdays = AvailabilityRule::where('artist_id', $artist->id)
            ->where('unavailable', true)
            ->pluck('weekday')
            ->map(fn ($weekday) => (int) $weekday)
            ->all();
        $overrides = AvailabilityOverride::where('artist_id', $artist->id)
            ->whereBetween('date', $range)
            ->get(['date', 'state'])
            ->mapWithKeys(fn (AvailabilityOverride $override) => [$override->date->toDateString() => $override->state]);
        $bookings = Booking::where('artist_id', $artist->id)
            ->where('status', BookingStatus::Confirmed)
            ->whereBetween('event_date', $range)
            ->get(['event_date', 'kind', 'church_city'])
            ->keyBy(fn (Booking $booking) => $booking->event_date->toDateString());

        for ($date = $from; $date->lte($until); $date = $date->addDay()) {
            $day = $date->toDateString();
            if ($booking = $bookings->get($day)) {
                yield new TourDate($date, TourDateStatus::Booked, $booking->kind, $booking->church_city);

                continue;
            }
            $override = $overrides->get($day);
            $free = $override !== null
                ? $override === OverrideState::Free
                : ! in_array($date->isoWeekday(), $unavailableWeekdays, true);
            if ($free) {
                yield new TourDate($date, TourDateStatus::Free);
            }
        }
    }

    /**
     * @param  list<int>  $artistIds
     * @param  GatheringKind|null  $kind  null when the kind is not known yet; only a youth event adds a rule
     * @return list<int> the ids among `$artistIds` that are free
     */
    public function freeArtistIds(array $artistIds, CarbonImmutable $date, ?GatheringKind $kind = null): array
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
