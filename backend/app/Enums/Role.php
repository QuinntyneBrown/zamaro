<?php

namespace App\Enums;

/** What a person may do on Zamaro; a route guarded by a role answers 404 to anyone without it. */
enum Role: string
{
    case Booker = 'booker';
    case Artist = 'artist';
    case Administrator = 'admin';
}
