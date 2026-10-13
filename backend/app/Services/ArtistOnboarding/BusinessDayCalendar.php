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
        return ! $date->isWeekend() && ! array_key_exists($date->toDateString(), $this->holidays((int) $date->year));
    }

    /**
     * The holidays skipped between `$from` and `$until` (exclusive, inclusive): the ones the success
     * page names ("Monday 12 Oct is Thanksgiving").
     *
     * @return array<string, string> `YYYY-MM-DD` => name
     */
    public function holidaysBetween(CarbonInterface $from, CarbonInterface $until): array
    {
        $start = CarbonImmutable::instance($from)->setTimezone(config('app.timezone'))->startOfDay();
        $end = CarbonImmutable::instance($until)->setTimezone(config('app.timezone'))->startOfDay();
        $skipped = [];
        for ($year = (int) $start->year; $year <= (int) $end->year; $year++) {
            foreach ($this->holidays($year) as $date => $name) {
                if ($date > $start->toDateString() && $date <= $end->toDateString()) {
                    $skipped[$date] = $name;
                }
            }
        }

        return $skipped;
    }

    /**
     * Ontario's statutory holidays for a year, as observed, `YYYY-MM-DD` => name, in date order.
     *
     * @return array<string, string>
     */
    public function holidays(int $year): array
    {
        $easter = $this->easter($year);
        $fixed = [
            'New Year’s Day' => CarbonImmutable::create($year, 1, 1),
            'Canada Day' => CarbonImmutable::create($year, 7, 1),
            'Christmas Day' => CarbonImmutable::create($year, 12, 25),
            'Boxing Day' => CarbonImmutable::create($year, 12, 26),
        ];
        $floating = [
            'Good Friday' => $easter->subDays(2),
            'Family Day' => CarbonImmutable::create($year, 2, 1)->nthOfMonth(3, CarbonInterface::MONDAY),
            'Victoria Day' => $this->victoriaDay($year),
            'Labour Day' => CarbonImmutable::create($year, 9, 1)->nthOfMonth(1, CarbonInterface::MONDAY),
            'Thanksgiving' => CarbonImmutable::create($year, 10, 1)->nthOfMonth(2, CarbonInterface::MONDAY),
        ];

        $observed = [];
        foreach ($fixed as $name => $holiday) {
            $date = $holiday;
            while ($date->isWeekend() || array_key_exists($date->toDateString(), $observed)) {
                $date = $date->addDay();
            }
            $observed[$date->toDateString()] = $name;
        }
        foreach ($floating as $name => $holiday) {
            $observed[$holiday->toDateString()] = $name;
        }
        ksort($observed);

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
