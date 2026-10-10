<?php

namespace App\Actions\Discovery;

use App\Models\Artist;
use App\Services\Discovery\Coordinates;
use App\Services\Discovery\DistanceService;
use App\Services\Discovery\LineupCard;
use App\Services\Discovery\SearchCriteria;
use Illuminate\Database\Eloquent\Builder;

/**
 * Who is free on the date and within range (L2-003, L2-005), closest first; ties go to the higher
 * rating, then the lower artist id.
 */
class SearchAvailableArtists
{
    private const KM_PER_DEGREE_LATITUDE = 111.0;

    public function __construct(private readonly DistanceService $distances) {}

    /**
     * @return list<LineupCard>
     */
    public function handle(SearchCriteria $criteria): array
    {
        $candidates = Artist::query()
            ->visible()
            ->where(fn (Builder $query) => $this->withinBoundingBox($query, $criteria))
            ->with(['styles', 'rating'])
            ->get()
            ->keyBy('id');

        $distances = $this->distances->fromOrigin(
            $criteria->location,
            $candidates->map(fn (Artist $artist) => new Coordinates($artist->base_latitude, $artist->base_longitude))->all(),
        );

        $cards = [];
        foreach ($candidates as $id => $artist) {
            $distance = $distances[$id];
            if ($distance->km <= $criteria->radiusKm && $distance->km <= $artist->max_drive_km) {
                $cards[] = new LineupCard($artist, $distance);
            }
        }

        usort($cards, fn (LineupCard $a, LineupCard $b) => [$a->distance->km, -($a->artist->rating?->rating ?? 0), $a->artist->id]
            <=> [$b->distance->km, -($b->artist->rating?->rating ?? 0), $b->artist->id]);

        return $cards;
    }

    /** Road distance is never shorter than the straight line, so nothing in range lies outside this box. */
    private function withinBoundingBox(Builder $query, SearchCriteria $criteria): void
    {
        $latitudeSpan = $criteria->radiusKm / self::KM_PER_DEGREE_LATITUDE;
        $longitudeSpan = $criteria->radiusKm / (self::KM_PER_DEGREE_LATITUDE * cos(deg2rad($criteria->location->latitude)));

        $query->whereBetween('base_latitude', [$criteria->location->latitude - $latitudeSpan, $criteria->location->latitude + $latitudeSpan])
            ->whereBetween('base_longitude', [$criteria->location->longitude - $longitudeSpan, $criteria->location->longitude + $longitudeSpan]);
    }
}
