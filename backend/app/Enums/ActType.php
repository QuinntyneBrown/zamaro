<?php

namespace App\Enums;

enum ActType: string
{
    case Solo = 'solo';
    case Duo = 'duo';
    case Band = 'band';
    case Choir = 'choir';
}
