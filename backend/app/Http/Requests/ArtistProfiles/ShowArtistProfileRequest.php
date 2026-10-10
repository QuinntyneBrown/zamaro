<?php

namespace App\Http\Requests\ArtistProfiles;

use App\Enums\GatheringKind;
use App\Http\Requests\Discovery\SearchArtistsRequest;
use App\Services\ArtistAvailability\BookingWindow;
use App\Services\Discovery\Coordinates;
use App\Services\Discovery\SearchCriteria;
use App\Services\Discovery\ServiceArea;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The profile, with the Discover search it was opened from. The search only matters when the
 * artist is missing: it picks the similar artists (L2-021.1). A stale date is not an error, so an
 * old link still opens the profile.
 */
class ShowArtistProfileRequest extends FormRequest
{
    /** Without a carried radius, the Discover default. */
    public const DEFAULT_RADIUS_KM = 120;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The search date, `YYYY-MM-DD`; outside the booking window, the first bookable day is used. */
            'date' => ['nullable', 'date_format:Y-m-d'],
            'kind' => ['nullable', Rule::enum(GatheringKind::class)],
            /** The search location; without both coordinates, Toronto City Hall. */
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            /** Driving radius in kilometres; 120 by default. */
            'radius' => ['nullable', 'integer', Rule::in(SearchArtistsRequest::RADII_KM)],
        ];
    }

    /** The carried search, with Toronto, the first bookable day and 120 km for what is missing. */
    public function carriedSearch(): SearchCriteria
    {
        $date = $this->validated('date');
        $date = $date === null ? null : BookingWindow::date($date);
        $inWindow = $date !== null && $date->betweenIncluded(BookingWindow::earliest(), BookingWindow::latest());
        $lat = $this->validated('lat');
        $lng = $this->validated('lng');

        return new SearchCriteria(
            $inWindow ? $date : BookingWindow::earliest(),
            GatheringKind::tryFrom((string) $this->validated('kind')) ?? GatheringKind::SundayService,
            $lat !== null && $lng !== null ? new Coordinates((float) $lat, (float) $lng) : ServiceArea::cityHall(),
            (int) ($this->validated('radius') ?? self::DEFAULT_RADIUS_KM),
        );
    }
}
