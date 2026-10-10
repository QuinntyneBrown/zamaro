<?php

namespace App\Services\Discovery;

use App\Models\Artist;

/** One artist in the lineup with their distance from the event. */
final class LineupCard
{
    public function __construct(
        public readonly Artist $artist,
        public readonly Distance $distance,
    ) {}
}
