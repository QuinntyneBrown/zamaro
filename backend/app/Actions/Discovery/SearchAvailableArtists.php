<?php

namespace App\Actions\Discovery;

use App\Models\Artist;
use App\Services\ArtistAvailability\AvailabilityService;
use App\Services\Discovery\Coordinates;
use App\Services\Discovery\DistanceService;
use App\Services\Discovery\HeadlinerPicker;
use App\Services\Discovery\Lineup;
use App\Services\Discovery\LineupCard;
use App\Services\Discovery\LineupSorter;
use App\Services\Discovery\PageCursor;
use App\Services\Discovery\SearchCriteria;
use App\Services\Discovery\Season;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Who is free on the date and within range (L2-003, L2-005): the headliner first (L2-006), then the
 * tickets closest first; ties go to the higher rating, then the lower artist id.
 */
class SearchAvailableArtists
{
    private const KM_PER_DEGREE_LATITUDE = 111.0;

    public function __construct(
        private readonly AvailabilityService $availability,
        private readonly DistanceService $distances,
        private readonly HeadlinerPicker $headliners,
        private readonly LineupSorter $sorter,
    ) {}

    /**
     * @param  list<int|float>|null  $after  continue after this sort key (a decoded page cursor)
     */
    public function handle(SearchCriteria $criteria, ?array $after = null): Lineup
    {
        $today = CarbonImmutable::now('America/Toronto');
        $cards = $this->matches($criteria);
        $headliner = $this->headliners->pick($cards, $today);
        $tickets = $this->sorter->sort(
            array_values(array_filter($cards, fn (LineupCard $card) => $card !== $headliner)),
            $criteria->sort,
        );

        // The first page holds the headliner and 23 tickets; later pages hold 24 tickets.
        $firstPage = $after === null;
        if (! $firstPage) {
            $tickets = array_values(array_filter(
                $tickets,
                fn (LineupCard $card) => $this->sorter->key($card, $criteria->sort) > $after,
            ));
        }
        $size = $firstPage && $headliner ? Lineup::PER_PAGE - 1 : Lineup::PER_PAGE;
        $page = array_slice($tickets, 0, $size);
        $last = end($page);

        return new Lineup(
            $firstPage ? $headliner : null,
            $firstPage && $headliner ? $this->headliners->quoteFor($headliner) : null,
            Season::of($today),
            $page,
            count($cards),
            count($tickets) > $size && $last ? PageCursor::encode($criteria->sort, $this->sorter->key($last, $criteria->sort)) : null,
        );
    }

    /**
     * @return list<LineupCard>
     */
    private function matches(SearchCriteria $criteria): array
    {
        $candidates = Artist::query()
            ->visible()
            ->where(fn (Builder $query) => $this->withinBoundingBox($query, $criteria))
            ->where(fn (Builder $query) => $criteria->filter->applyTo($query))
            ->with(['styles', 'rating'])
            ->get()
            ->keyBy('id');
        $candidates = $candidates->only(
            $this->availability->freeArtistIds($candidates->keys()->all(), $criteria->eventDate, $criteria->kind),
        );

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
