<?php

namespace App\Enums;

/** How the lineup's tickets are ordered (L2-007); values are the URL spellings. */
enum SearchSort: string
{
    case Closest = 'closest';
    case HighestRated = 'rating';
    case PriceLowToHigh = 'price';
}
