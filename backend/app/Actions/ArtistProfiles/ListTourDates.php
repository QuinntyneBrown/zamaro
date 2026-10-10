<?php

namespace App\Actions\ArtistProfiles;

use App\Services\ArtistAvailability\AvailabilityService;
use App\Services\ArtistAvailability\BookingWindow;
use App\Services\ArtistAvailability\TourDate;
use Carbon\CarbonImmutable;

/**
 * A visible artist's "On tour" list (L2-017): the next 6 free or booked dates from the search date,
 * or from 3 days from today when there is none, up to the end of the booking window.
 */
class ListTourDates
{
    public const LIMIT = 6;

    public function __construct(
        private readonly AvailabilityService $availability,
        private readonly ResolveArtistSlug $slugs,
    ) {}

    /**
     * @return list<TourDate>
     *
     * @throws ArtistMoved when the slug is the artist's retired one
     * @throws ArtistNotFound when no visible artist has the slug
     */
    public function handle(string $slug, ?CarbonImmutable $from): array
    {
        $artist = $this->slugs->handle($slug);

        // A search date sooner than the window cannot be booked, so the list starts where it can.
        $start = $from === null ? BookingWindow::earliest() : $from->max(BookingWindow::earliest());

        $dates = [];
        foreach ($this->availability->days($artist, $start, BookingWindow::latest()) as $date) {
            $dates[] = $date;
            if (count($dates) === self::LIMIT) {
                break;
            }
        }

        return $dates;
    }
}
