<?php

namespace App\Jobs\Concerns;

/**
 * The retry policy of every job and queued notification (L2-092.1, L2-065.2): one attempt and up to 5
 * retries, after about 10, 30, 90, 270 and 810 seconds (M2 D17). Each delay varies by up to 10 % so
 * jobs that failed together do not retry together. After the 6th failure the job moves to
 * `failed_jobs` and `ReportFailedJob` alerts.
 */
trait RetriesWithBackoff
{
    public int $tries = 6;

    /** @return list<int> seconds before each retry */
    public function backoff(): array
    {
        return array_map(fn (int $delay) => (int) round($delay * random_int(90, 110) / 100), [10, 30, 90, 270, 810]);
    }
}
