<?php

namespace App\Services\Bookings;

use Carbon\CarbonImmutable;

/**
 * The cancellation window every booking shares (L2-042, L2-044): a booker may cancel a Confirmed
 * booking for free up to and including 14 days before the event, so a Sat 14 Nov event cancels
 * free until the end of Sat 31 Oct. Refund amounts arrive with cancel-booking.
 */
class CancellationPolicy
{
    public const FREE_CANCELLATION_DAYS = 14;

    /** The last day a booking on `$eventDate` can be cancelled without losing the deposit. */
    public function freeCancellationUntil(CarbonImmutable $eventDate): CarbonImmutable
    {
        return $eventDate->subDays(self::FREE_CANCELLATION_DAYS);
    }
}
