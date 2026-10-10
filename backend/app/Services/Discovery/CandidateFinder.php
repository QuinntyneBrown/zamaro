<?php

namespace App\Services\Discovery;

use App\Models\Artist;
use Illuminate\Database\Eloquent\Builder;

/**
 * Visible artists who pass the filters and lie inside a bounding box of a radius around the event,
 * each measured once by road. Distance does not depend on the date, so one measurement serves the
 * search and every alternative date and radius.
 */
class CandidateFinder
{
    private const KM_PER_DEGREE_LATITUDE = 111.0;

    public function __construct(private readonly DistanceService $distances) {}

    /**
     * @return array<int, LineupCard> keyed by artist id, not yet checked against the travel rule
     */
    public function measured(SearchCriteria $criteria, int $boxRadiusKm): array
    {
        $artists = Artist::query()
            ->visible()
            ->where(fn (Builder $query) => $this->withinBoundingBox($query, $criteria->location, $boxRadiusKm))
            ->where(fn (Builder $query) => $criteria->filter->applyTo($query))
            ->with(['styles', 'rating'])
            ->get()
            ->keyBy('id');

        $distances = $this->distances->fromOrigin(
            $criteria->location,
            $artists->map(fn (Artist $artist) => new Coordinates($artist->base_latitude, $artist->base_longitude))->all(),
        );

        return $artists->map(fn (Artist $artist, int $id) => new LineupCard($artist, $distances[$id]))->all();
    }

    /** The travel rule (L2-003): within both the radius and the artist's own limit. */
    public static function travels(LineupCard $card, int $radiusKm): bool
    {
        return $card->distance->km <= $radiusKm && $card->distance->km <= $card->artist->max_drive_km;
    }

    /** Road distance is never shorter than the straight line, so nothing in range lies outside this box. */
    private function withinBoundingBox(Builder $query, Coordinates $centre, int $radiusKm): void
    {
        $latitudeSpan = $radiusKm / self::KM_PER_DEGREE_LATITUDE;
        $longitudeSpan = $radiusKm / (self::KM_PER_DEGREE_LATITUDE * cos(deg2rad($centre->latitude)));

        $query->whereBetween('base_latitude', [$centre->latitude - $latitudeSpan, $centre->latitude + $latitudeSpan])
            ->whereBetween('base_longitude', [$centre->longitude - $longitudeSpan, $centre->longitude + $longitudeSpan]);
    }
}
