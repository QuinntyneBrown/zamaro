<?php

namespace App\Enums;

/** A date in an artist's "On tour" list (L2-017): free to book, or taken by a Confirmed booking. */
enum TourDateStatus: string
{
    case Free = 'free';
    case Booked = 'booked';
}
