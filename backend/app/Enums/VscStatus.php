<?php

namespace App\Enums;

/** Vulnerable Sector Check review state (L2-049). */
enum VscStatus: string
{
    case Scanning = 'scanning';
    case Pending = 'pending';
    case Verified = 'verified';
    case Blocked = 'blocked';
}
