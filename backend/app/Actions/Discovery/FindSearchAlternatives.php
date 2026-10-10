<?php

namespace App\Actions\Discovery;

use App\Http\Requests\Discovery\SearchArtistsRequest;
use App\Services\ArtistAvailability\AvailabilityService;
use App\Services\Discovery\CandidateFinder;
use App\Services\Discovery\LineupCard;
use App\Services\Discovery\SearchAlternatives;
use App\Services\Discovery\SearchCriteria;
use Carbon\CarbonImmutable;

/**
 * Ways forward when nobody is free (L2-011): up to three dates within 7 days either side on which
 * someone is free under the current filters, closest first (the earlier of two equally far), and
 * the smallest wider radius with matches on the searched date.
 */
class FindSearchAlternatives
{
    private const DAYS_EITHER_SIDE = 7;

    private const MAX_DATES = 3;

    public function __construct(
        private readonly CandidateFinder $candidates,
        private readonly AvailabilityService $availability,
    ) {}

    public function handle(SearchCriteria $criteria): SearchAlternatives
    {
        $wider = array_values(array_filter(SearchArtistsRequest::RADII_KM, fn (int $km) => $km > $criteria->radiusKm));
        $candidates = $this->candidates->measured($criteria, $wider === [] ? $criteria->radiusKm : max($wider));
        $ids = array_keys($candidates);

        return new SearchAlternatives(
            $this->nearbyDates($criteria, $candidates, $ids),
            $this->widerRadius($criteria, $candidates, $ids, $wider),
            $criteria->filter->styles !== [] || $criteria->filter->under800,
        );
    }

    /**
     * @param  array<int, LineupCard>  $candidates
     * @param  list<int>  $ids
     * @return list<array{date: string, count: int}>
     */
    private function nearbyDates(SearchCriteria $criteria, array $candidates, array $ids): array
    {
        $today = CarbonImmutable::now('America/Toronto')->startOfDay();
        $earliest = $today->addDays(3);
        $latest = $today->addMonthsNoOverflow(18);

        $offsets = [];
        foreach (range(1, self::DAYS_EITHER_SIDE) as $days) {
            array_push($offsets, -$days, $days);
        }

        $dates = [];
        foreach ($offsets as $offset) {
            $date = $criteria->eventDate->addDays($offset);
            if ($date->lt($earliest) || $date->gt($latest)) {
                continue;
            }
            $count = $this->countFree($candidates, $ids, $date, $criteria, $criteria->radiusKm);
            if ($count > 0) {
                $dates[] = ['date' => $date->toDateString(), 'count' => $count];
            }
            if (count($dates) === self::MAX_DATES) {
                break;
            }
        }

        return $dates;
    }

    /**
     * @param  array<int, LineupCard>  $candidates
     * @param  list<int>  $ids
     * @param  list<int>  $wider
     * @return array{km: int, count: int}|null
     */
    private function widerRadius(SearchCriteria $criteria, array $candidates, array $ids, array $wider): ?array
    {
        foreach ($wider as $km) {
            $count = $this->countFree($candidates, $ids, $criteria->eventDate, $criteria, $km);
            if ($count > 0) {
                return ['km' => $km, 'count' => $count];
            }
        }

        return null;
    }

    /**
     * @param  array<int, LineupCard>  $candidates
     * @param  list<int>  $ids
     */
    private function countFree(array $candidates, array $ids, CarbonImmutable $date, SearchCriteria $criteria, int $radiusKm): int
    {
        $free = $this->availability->freeArtistIds($ids, $date, $criteria->kind);

        return count(array_filter($free, fn (int $id) => CandidateFinder::travels($candidates[$id], $radiusKm)));
    }
}
