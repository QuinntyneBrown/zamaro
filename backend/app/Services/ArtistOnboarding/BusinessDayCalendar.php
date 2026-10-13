<?php

namespace App\Services\ArtistOnboarding;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * Business days in Ontario (L2-047.4): weekdays that are not statutory holidays. A holiday that
 * falls on a weekend is observed on the next weekday, as employers do. Shared with payouts (M7).
 */
class BusinessDayCalendar
{
    /** The date `$days` business days after `$from`, counting from the next business day. */
    public function businessDaysAfter(CarbonInterface $from, int $days): CarbonImmutable
    {
        $date = CarbonImmutable::instance($from)->setTimezone(config('app.timezone'))->startOfDay();
        $remaining = $days;
        while ($remaining > 0) {
            $date = $date->addDay();
            if ($this->isBusinessDay($date)) {
                $remaining--;
            }
        }

        return $date;
    }

    public function isBusinessDay(CarbonInterface $date): bool
    {
        return ! $date->isWeekend() && ! in_array($date->toDateString(), $this->holidays((int) $date->year), true);
    }

    /**
     * Ontario's statutory holidays for a year, as observed, `YYYY-MM-DD`.
     *
     * @return list<string>
     */
    public function holidays(int $year): array
    {
        $easter = $this->easter($year);
        $fixed = [
            CarbonImmutable::create($year, 1, 1),   // New Year's Day
            CarbonImmutable::create($year, 7, 1),   // Canada Day
            CarbonImmutable::create($year, 12, 25), // Christmas Day
            CarbonImmutable::create($year, 12, 26), // Boxing Day
        ];
        $floating = [
            $easter->subDays(2),                                     // Good Friday
            CarbonImmutable::create($year, 2, 1)->nthOfMonth(3, CarbonInterface::MONDAY), // Family Day
            $this->victoriaDay($year),
            CarbonImmutable::create($year, 9, 1)->nthOfMonth(1, CarbonInterface::MONDAY),  // Labour Day
            CarbonImmutable::create($year, 10, 1)->nthOfMonth(2, CarbonInterface::MONDAY), // Thanksgiving
        ];

        $observed = [];
        foreach ($fixed as $holiday) {
            $date = $holiday;
            while ($date->isWeekend() || in_array($date->toDateString(), $observed, true)) {
                $date = $date->addDay();
            }
            $observed[] = $date->toDateString();
        }
        foreach ($floating as $holiday) {
            $observed[] = $holiday->toDateString();
        }
        sort($observed);

        return $observed;
    }

    /** Victoria Day: the last Monday before 25 May. */
    private function victoriaDay(int $year): CarbonImmutable
    {
        $may24 = CarbonImmutable::create($year, 5, 24);

        return $may24->isMonday() ? $may24 : $may24->previous(CarbonInterface::MONDAY);
    }

    /** Easter Sunday (Gregorian, the anonymous algorithm). */
    private function easter(int $year): CarbonImmutable
    {
        $a = $year % 19;
        $b = intdiv($year, 100);
        $c = $year % 100;
        $d = intdiv($b, 4);
        $e = $b % 4;
        $f = intdiv($b + 8, 25);
        $g = intdiv($b - $f + 1, 3);
        $h = (19 * $a + $b - $d - $g + 15) % 30;
        $i = intdiv($c, 4);
        $k = $c % 4;
        $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
        $m = intdiv($a + 11 * $h + 22 * $l, 451);
        $month = intdiv($h + $l - 7 * $m + 114, 31);
        $day = (($h + $l - 7 * $m + 114) % 31) + 1;

        return CarbonImmutable::create($year, $month, $day);
    }
}
