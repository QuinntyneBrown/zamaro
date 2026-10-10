<?php

namespace App\Services\Discovery;

use App\Enums\SearchSort;

/**
 * Orders the tickets below the headliner (L2-007). Artist id closes every order, so paging is
 * stable.
 */
class LineupSorter
{
    /**
     * @param  list<LineupCard>  $cards
     * @return list<LineupCard>
     */
    public function sort(array $cards, SearchSort $sort): array
    {
        usort($cards, fn (LineupCard $a, LineupCard $b) => $this->key($a, $sort) <=> $this->key($b, $sort));

        return $cards;
    }

    /**
     * The card's position in the sort; smaller keys come first. The paging cursor stores it.
     *
     * @return list<int|float>
     */
    public function key(LineupCard $card, SearchSort $sort): array
    {
        $rating = $card->artist->rating;

        return match ($sort) {
            SearchSort::Closest => [$card->distance->km, -($rating?->rating ?? 0), $card->artist->id],
            SearchSort::HighestRated => [
                $rating?->rating === null ? 1 : 0,
                -($rating?->rating ?? 0),
                -($rating?->review_count ?? 0),
                $card->distance->km,
                $card->artist->id,
            ],
            SearchSort::PriceLowToHigh => [$card->artist->from_price_cents, $card->distance->km, $card->artist->id],
        };
    }
}
