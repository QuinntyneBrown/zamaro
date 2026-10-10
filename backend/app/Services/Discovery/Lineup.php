<?php

namespace App\Services\Discovery;

/**
 * One page of a search result (L2-006, L2-010): on the first page the headliner, then the tickets;
 * later pages hold tickets alone.
 */
final class Lineup
{
    public const PER_PAGE = 24;

    /**
     * @param  list<LineupCard>  $tickets  this page's tickets, without the headliner
     * @param  int  $total  every artist free and in range, the headliner included
     * @param  string|null  $nextCursor  null on the last page
     */
    public function __construct(
        public readonly ?LineupCard $headliner,
        public readonly ?HeadlinerQuote $quote,
        public readonly Season $season,
        public readonly array $tickets,
        public readonly int $total,
        public readonly ?string $nextCursor = null,
    ) {}
}
