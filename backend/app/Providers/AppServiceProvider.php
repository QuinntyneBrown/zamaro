<?php

namespace App\Providers;

use App\Contracts\RoutingProvider;
use App\Integrations\Routing\FakeRoutingProvider;
use Carbon\CarbonImmutable;
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
        RoutingProvider::class => FakeRoutingProvider::class,
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

        // The e2e API runs on the mocks' "today" so date rules match the frozen browser clock.
        if ($frozenNow = config('zamaro.frozen_now')) {
            Carbon::setTestNow(CarbonImmutable::parse($frozenNow));
        }
    }
}
