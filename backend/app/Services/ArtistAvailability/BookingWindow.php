<?php

namespace App\Services\ArtistAvailability;

use Carbon\CarbonImmutable;

/**
 * The dates a church can book (L2-004): from 3 days to 18 months ahead, counted in Toronto.
 */
class BookingWindow
{
    public const TIME_ZONE = 'America/Toronto';

    public static function earliest(): CarbonImmutable
    {
        return self::today()->addDays(3);
    }

    public static function latest(): CarbonImmutable
    {
        return self::today()->addMonthsNoOverflow(18);
    }

    /** A `YYYY-MM-DD` date as the start of that day in Toronto. */
    public static function date(string $date): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('Y-m-d', $date, self::TIME_ZONE)->startOfDay();
    }

    private static function today(): CarbonImmutable
    {
        return CarbonImmutable::now(self::TIME_ZONE)->startOfDay();
    }
}
