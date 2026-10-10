<?php

namespace App\Services\Discovery;

use App\Enums\BookingStatus;
use App\Models\Review;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * The headliner (L2-006): among the results, the artist with the most bookings confirmed since the
 * start of the current season, not counting bookings since cancelled; ties go to the higher rating,
 * then the shorter distance, then the lower artist id.
 */
class HeadlinerPicker
{
    /**
     * @param  list<LineupCard>  $cards
     */
    public function pick(array $cards, CarbonImmutable $today): ?LineupCard
    {
        if ($cards === []) {
            return null;
        }
        $confirmed = $this->confirmedThisSeason(array_map(fn (LineupCard $card) => $card->artist->id, $cards), $today);

        $ranked = $cards;
        usort($ranked, fn (LineupCard $a, LineupCard $b) => $this->rank($b, $confirmed) <=> $this->rank($a, $confirmed));

        return $ranked[0];
    }

    public function quoteFor(LineupCard $headliner): ?HeadlinerQuote
    {
        $review = Review::visible()
            ->where('artist_id', $headliner->artist->id)
            ->where('stars', 5)
            ->with(['booker', 'booking'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();

        return $review === null ? null : new HeadlinerQuote(
            HeadlinerQuote::excerpt($review->text),
            $review->booker->name,
            $review->booking->church_city,
        );
    }

    /** Higher ranks first: more bookings, higher rating, shorter distance, lower id. */
    private function rank(LineupCard $card, array $confirmed): array
    {
        return [
            $confirmed[$card->artist->id] ?? 0,
            $card->artist->rating?->rating ?? 0,
            -$card->distance->km,
            -$card->artist->id,
        ];
    }

    /**
     * @param  list<int>  $artistIds
     * @return array<int, int> artist id => bookings confirmed this season
     */
    private function confirmedThisSeason(array $artistIds, CarbonImmutable $today): array
    {
        return DB::table('bookings')
            ->join('booking_transitions', 'booking_transitions.booking_id', '=', 'bookings.id')
            ->whereIn('bookings.artist_id', $artistIds)
            ->where('booking_transitions.to_status', BookingStatus::Confirmed->value)
            ->where('booking_transitions.occurred_at', '>=', Season::startOf($today)->toDateTimeString())
            ->where('bookings.status', '!=', BookingStatus::Cancelled->value)
            ->groupBy('bookings.artist_id')
            ->selectRaw('bookings.artist_id, count(distinct bookings.id) as confirmed')
            ->pluck('confirmed', 'artist_id')
            ->map(fn ($count) => (int) $count)
            ->all();
    }
}
