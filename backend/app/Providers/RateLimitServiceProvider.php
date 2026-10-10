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
        // L2-077.1: every /api/v1 request. Anonymous traffic is counted by address; a signed-in person
        // by account, wherever they connect from (M2 D7).
        RateLimiter::for('api', function (Request $request) {
            $user = $request->user();

            return $user === null
                ? Limit::perMinute((int) config('zamaro.rate_limits.api_per_minute'))->by('ip:'.$request->ip())
                : Limit::perMinute((int) config('zamaro.rate_limits.api_signed_in_per_minute'))->by('user:'.$user->getAuthIdentifier());
        });

        // L2-077.2: 30 searches a minute per address and, once signed in, per account as well.
        RateLimiter::for('search', function (Request $request) {
            $perMinute = (int) config('zamaro.rate_limits.search_per_minute');
            $limits = [Limit::perMinute($perMinute)->by('search-ip:'.$request->ip())];
            if ($user = $request->user()) {
                $limits[] = Limit::perMinute($perMinute)->by('search-user:'.$user->getAuthIdentifier());
            }

            return $limits;
        });

        // M2 D6: registrations send email to whatever address is typed, so 10 an hour per address.
        RateLimiter::for('register', fn (Request $request) => Limit::perHour((int) config('zamaro.rate_limits.register_per_hour'))
            ->by('register-ip:'.$request->ip()));

        // M2 D6: new verification links, 3 in 15 minutes per account, or per address for a guest.
        RateLimiter::for('resend-verification', function (Request $request) {
            $limit = Limit::perMinutes(15, (int) config('zamaro.rate_limits.resend_verification_per_15_minutes'));
            $user = $request->user();

            return $user === null ? $limit->by('resend-ip:'.$request->ip()) : $limit->by('resend-user:'.$user->getAuthIdentifier());
        });
    }
}
