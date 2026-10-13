<?php

namespace App\Services\Accounts;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiter;
use Illuminate\Contracts\Cache\Repository;

/**
 * The sign-in lockout (L2-072.4): 5 failures for one address within 15 minutes pause sign-in for that
 * address for 15 minutes. Counted by the address in lower case, whether or not it has an account, so
 * a pause says nothing about which addresses do.
 */
class SignInThrottle
{
    public const MAX_FAILURES = 5;

    public const WINDOW_SECONDS = 900;

    public const PAUSE_SECONDS = 900;

    public function __construct(private readonly RateLimiter $limiter, private readonly Repository $cache) {}

    /** When sign-in resumes for the address, or null when it is not paused. */
    public function pausedUntil(string $email): ?CarbonImmutable
    {
        $until = $this->cache->get($this->pauseKey($email));

        return $until === null ? null : CarbonImmutable::createFromTimestamp($until, config('app.timezone'));
    }

    /** A wrong password; the fifth within the window starts the pause. */
    public function recordFailure(string $email): void
    {
        if ($this->limiter->hit($this->failuresKey($email), self::WINDOW_SECONDS) >= self::MAX_FAILURES) {
            $this->limiter->clear($this->failuresKey($email));
            $this->cache->put($this->pauseKey($email), now()->addSeconds(self::PAUSE_SECONDS)->getTimestamp(), self::PAUSE_SECONDS);
        }
    }

    /** A successful sign-in starts the count again. */
    public function clear(string $email): void
    {
        $this->limiter->clear($this->failuresKey($email));
    }

    /** True the first time it is asked during a pause: the owner is emailed once per pause. */
    public function firstRefusal(string $email, CarbonImmutable $pausedUntil): bool
    {
        $seconds = max(1, (int) ceil(now()->diffInSeconds($pausedUntil)));

        return $this->cache->add($this->pauseKey($email).':told', true, $seconds);
    }

    private function failuresKey(string $email): string
    {
        return 'sign-in-failures:'.hash('sha256', $email);
    }

    private function pauseKey(string $email): string
    {
        return 'sign-in-paused:'.hash('sha256', $email);
    }
}
