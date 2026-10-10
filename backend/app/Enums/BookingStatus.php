<?php

namespace App\Enums;

enum BookingStatus: string
{
    case Requested = 'requested';
    case Accepted = 'accepted';
    case Confirmed = 'confirmed';
    case Completed = 'completed';
    case Declined = 'declined';
    case Withdrawn = 'withdrawn';
    case Expired = 'expired';
    case Cancelled = 'cancelled';
}
