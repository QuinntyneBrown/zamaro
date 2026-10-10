<?php

namespace App\Enums;

/** How profile copy refers to the artist; a group act is always They. */
enum Pronoun: string
{
    case She = 'she';
    case He = 'he';
    case They = 'they';
}
