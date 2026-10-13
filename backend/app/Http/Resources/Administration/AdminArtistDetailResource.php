<?php

namespace App\Http\Resources\Administration;

use App\Enums\BookingStatus;
use App\Models\Artist;
use App\Models\ArtistStyle;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An artist as the administrator sees them (pages/admin-artist, M3 D18): the account, the profile,
 * the bookings still to come and their standing. Suspend and reinstate join with M8.
 *
 * @property Artist $resource
 */
class AdminArtistDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $artist = $this->resource;
        $upcoming = Booking::where('artist_id', $artist->id)
            ->whereIn('status', [BookingStatus::Requested->value, BookingStatus::Accepted->value, BookingStatus::Confirmed->value])
            ->where('event_date', '>=', today()->toDateString())
            ->orderBy('event_date')
            ->get();

        return [
            'id' => $artist->id,
            'name' => $artist->display_name,
            'slug' => $artist->slug,
            /** The account's address. */
            'email' => $artist->user->email,
            /** @var 'solo'|'duo'|'band'|'choir' */
            'actType' => $artist->act_type->value,
            /** Style codes, in the profile's order. */
            'styles' => $artist->styles->map(fn (ArtistStyle $style) => $style->style->value)->values()->all(),
            'baseCity' => $artist->base_city,
            /** The "from" price per service, in cents. */
            'fromPriceCents' => $artist->from_price_cents,
            /** One decimal, or null before the first review. */
            'rating' => $artist->rating?->rating === null ? null : (float) $artist->rating->rating,
            /** @var 'approved'|'suspended' */
            'status' => $artist->status->value,
            /**
             * When the application was approved, Toronto time, or null for artists who predate the record.
             *
             * @var string|null
             */
            'approvedAt' => $artist->approved_at?->setTimezone(config('app.timezone'))->toIso8601String(),
            /** Requested, accepted and confirmed bookings from today, soonest first. */
            'upcomingBookings' => $upcoming->map(fn (Booking $booking) => [
                'number' => $booking->number,
                /** `YYYY-MM-DD`. */
                'eventDate' => $booking->event_date->toDateString(),
                'churchName' => $booking->church_name,
                'churchCity' => $booking->church_city,
                /** @var 'sunday-service'|'worship-night'|'youth-event'|'conference-or-retreat'|'wedding'|'funeral-or-memorial' */
                'kind' => $booking->kind->value,
                /** @var 'requested'|'accepted'|'confirmed' */
                'status' => $booking->status->value,
            ])->all(),
            /**
             * Past suspensions, newest first; always empty until suspend-and-reinstate (M8).
             *
             * @var list<array{suspendedAt: string, reinstatedAt: string|null, reason: string}>
             */
            'suspensions' => [],
        ];
    }
}
