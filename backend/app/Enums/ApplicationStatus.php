<?php

namespace App\Enums;

/** Where an artist application stands (L2-047, L2-048). */
enum ApplicationStatus: string
{
    case Submitted = 'submitted';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
