<?php

namespace App\Enums;

/** A dated exception to an artist's weekly availability. */
enum OverrideState: string
{
    case Free = 'free';
    case Unavailable = 'unavailable';
}
