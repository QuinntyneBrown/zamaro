<?php

namespace App\Services\Discovery;

use App\Enums\SearchSort;
use App\Enums\Style;
use App\Services\ArtistAvailability\AvailabilityService;

/**
 * Viewable artists to offer instead of one who cannot be booked: they share the style, are free on
 * the search date and pass the travel rule from the search location, nearest first as on Discover
 * (L2-021.1). The booking decline and cancellation slices reuse it.
 */
class SimilarArtistFinder
{
    public const LIMIT = 3;

    public function __construct(
        private readonly CandidateFinder $candidates,
        private readonly AvailabilityService $availability,
        private readonly LineupSorter $sorter,
    ) {}

    /**
     * @param  Style|null  $style  null when the missing artist never existed: any style matches
     */
    public function forMissingArtist(?Style $style, SearchCriteria $search, int $limit = self::LIMIT): SimilarArtists
    {
        $criteria = new SearchCriteria(
            $search->eventDate, $search->kind, $search->location, $search->radiusKm,
            filter: new LineupFilter($style === null ? [] : [$style]),
        );
        $candidates = $this->candidates->measured($criteria, $criteria->radiusKm);
        $free = array_flip($this->availability->freeArtistIds(array_keys($candidates), $criteria->eventDate, $criteria->kind));
        $matches = array_values(array_filter(
            $candidates,
            fn (LineupCard $card) => isset($free[$card->artist->id]) && CandidateFinder::travels($card, $criteria->radiusKm),
        ));

        return new SimilarArtists(
            $criteria->eventDate,
            $criteria->radiusKm,
            array_slice($this->sorter->sort($matches, SearchSort::Closest), 0, $limit),
        );
    }
}
