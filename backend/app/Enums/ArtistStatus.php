<?php

namespace App\Enums;

enum ArtistStatus: string
{
    case Approved = 'approved';
    case Suspended = 'suspended';
    case Deleted = 'deleted';
}
