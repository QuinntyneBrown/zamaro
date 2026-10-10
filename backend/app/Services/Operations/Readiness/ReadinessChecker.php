<?php

namespace App\Services\Operations\Readiness;

use Throwable;

/**
 * Runs every readiness check; the instance stays in rotation only while all pass (L2-090.2).
 */
class ReadinessChecker
{
    /** @var list<HealthCheck> */
    private array $checks;

    public function __construct()
    {
        $this->checks = [new DatabaseCheck, RedisCheck::cache(), RedisCheck::queue()];
    }

    public function run(): ReadinessReport
    {
        $results = [];
        foreach ($this->checks as $check) {
            $startedAt = hrtime(true);
            try {
                $check->check();
                $ok = true;
            } catch (Throwable) {
                $ok = false;
            }
            $results[] = new CheckResult($check->name(), $ok, intdiv(hrtime(true) - $startedAt, 1_000_000));
        }

        return new ReadinessReport($results);
    }
}
