<?php

namespace App\Services\Discovery;

use Carbon\CarbonImmutable;

/** Seasons as L2-006 counts them, in Toronto time. */
enum Season: string
{
    case Spring = 'spring';
    case Summer = 'summer';
    case Autumn = 'autumn';
    case Winter = 'winter';

    public static function of(CarbonImmutable $date): self
    {
        return match (true) {
            $date->month >= 3 && $date->month <= 5 => self::Spring,
            $date->month >= 6 && $date->month <= 8 => self::Summer,
            $date->month >= 9 && $date->month <= 11 => self::Autumn,
            default => self::Winter,
        };
    }

    /** Midnight on the first day of the season `$date` falls in (1 Dec for a February date). */
    public static function startOf(CarbonImmutable $date): CarbonImmutable
    {
        $firstMonth = match (self::of($date)) {
            self::Spring => 3,
            self::Summer => 6,
            self::Autumn => 9,
            self::Winter => 12,
        };
        $year = $firstMonth === 12 && $date->month < 12 ? $date->year - 1 : $date->year;

        return CarbonImmutable::create($year, $firstMonth, 1, 0, 0, 0, $date->getTimezone());
    }
}
