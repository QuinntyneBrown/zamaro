<?php

namespace App\Actions\Discovery;

use App\Services\ArtistAvailability\AvailabilityService;
use App\Services\Discovery\CandidateFinder;
use App\Services\Discovery\HeadlinerPicker;
use App\Services\Discovery\Lineup;
use App\Services\Discovery\LineupCard;
use App\Services\Discovery\LineupSorter;
use App\Services\Discovery\PageCursor;
use App\Services\Discovery\SearchCriteria;
use App\Services\Discovery\Season;
use Carbon\CarbonImmutable;

/**
 * Who is free on the date and within range (L2-003, L2-005): the headliner first (L2-006), then the
 * tickets closest first; ties go to the higher rating, then the lower artist id.
 */
class SearchAvailableArtists
{
    public function __construct(
        private readonly AvailabilityService $availability,
        private readonly CandidateFinder $candidates,
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
        $candidates = $this->candidates->measured($criteria, $criteria->radiusKm);
        $free = array_flip($this->availability->freeArtistIds(array_keys($candidates), $criteria->eventDate, $criteria->kind));

        return array_values(array_filter(
            $candidates,
            fn (LineupCard $card) => isset($free[$card->artist->id]) && CandidateFinder::travels($card, $criteria->radiusKm),
        ));
    }
}
