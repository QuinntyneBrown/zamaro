<?php

namespace App\Providers;

use App\Contracts\BotChallenge;
use App\Contracts\BreachedPasswordChecker;
use App\Contracts\ErrorReporter;
use App\Contracts\Geocoder;
use App\Contracts\IpLocator;
use App\Contracts\MediaScanner;
use App\Contracts\OnCallAlerter;
use App\Contracts\RoutingProvider;
use App\Contracts\VideoTranscoder;
use App\Integrations\Alerting\FakeOnCallAlerter;
use App\Integrations\BotChallenge\FakeBotChallenge;
use App\Integrations\BreachedPasswords\FakeBreachedPasswordChecker;
use App\Integrations\ErrorTracking\FakeErrorReporter;
use App\Integrations\Geocoding\FakeGeocoder;
use App\Integrations\IpLocation\FakeIpLocator;
use App\Integrations\Routing\FakeRoutingProvider;
use App\Integrations\Scanning\FakeMediaScanner;
use App\Integrations\Video\FakeVideoTranscoder;
use Carbon\CarbonImmutable;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Support\Carbon;
use Illuminate\Support\ServiceProvider;
use LogicException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Outside vendors are ports with deterministic fakes until their adapters land (ADR-0002).
     *
     * @var array<class-string, class-string>
     */
    private const FAKES = [
        Geocoder::class => FakeGeocoder::class,
        RoutingProvider::class => FakeRoutingProvider::class,
        BotChallenge::class => FakeBotChallenge::class,
        BreachedPasswordChecker::class => FakeBreachedPasswordChecker::class,
        ErrorReporter::class => FakeErrorReporter::class,
        OnCallAlerter::class => FakeOnCallAlerter::class,
        IpLocator::class => FakeIpLocator::class,
        MediaScanner::class => FakeMediaScanner::class,
        VideoTranscoder::class => FakeVideoTranscoder::class,
    ];

    public function register(): void
    {
        foreach (self::FAKES as $port => $fake) {
            $this->app->singleton($port, $fake);
        }
    }

    public function boot(): void
    {
        if ($this->app->environment('production')) {
            throw new LogicException('Fake vendor adapters are bound in production: '.implode(', ', array_keys(self::FAKES)));
        }

        // Only these callers may name the client's address in X-Forwarded-For: the load balancer and the
        // web app's server (record-audit-log, limit-request-rates). Anyone else's header is ignored.
        if ($proxies = config('zamaro.trusted_proxies')) {
            TrustProxies::at($proxies);
        }

        // The e2e API runs on the mocks' "today" so date rules match the frozen browser clock.
        if ($frozenNow = config('zamaro.frozen_now')) {
            Carbon::setTestNow(CarbonImmutable::parse($frozenNow));
        }
    }
}
