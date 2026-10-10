<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

/** Named rate limiters (L2-077, security/limit-request-rates). */
class RateLimitServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // L2-077.2: 30 searches a minute per address; the per-account limit joins it with sign-in.
        RateLimiter::for('search', fn (Request $request) => Limit::perMinute((int) config('zamaro.rate_limits.search_per_minute'))
            ->by('search-ip:'.$request->ip()));
    }
}
