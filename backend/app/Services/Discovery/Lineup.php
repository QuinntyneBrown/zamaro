<?php

namespace App\Services\Discovery;

/** A search result: the headliner, then the other artists as tickets (L2-006). */
final class Lineup
{
    /**
     * @param  list<LineupCard>  $tickets  without the headliner
     */
    public function __construct(
        public readonly ?LineupCard $headliner,
        public readonly ?HeadlinerQuote $quote,
        public readonly Season $season,
        public readonly array $tickets,
    ) {}

    /** Every artist free and in range, the headliner included. */
    public function total(): int
    {
        return count($this->tickets) + ($this->headliner ? 1 : 0);
    }
}
