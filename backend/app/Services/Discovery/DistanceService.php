<?php

namespace App\Services\Discovery;

use App\Contracts\RoutingProvider;
use App\Contracts\RoutingUnavailable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Driving distances between an event location and artists' bases (L2-002). Road distances are cached
 * per pair of coordinates rounded to 4 decimal places for 30 days. When routing is unavailable the
 * straight line x 1.3 stands in, marked approximate and never cached.
 */
class DistanceService
{
    private const CACHE_DAYS = 30;

    private const STRAIGHT_LINE_FACTOR = 1.3;

    /** Average speed for an estimated drive time, matching the radius labels ("120 km · 1.5 hr"). */
    private const ESTIMATE_KM_PER_HOUR = 80;

    public function __construct(private readonly RoutingProvider $routing) {}

    /**
     * @param  array<int|string, Coordinates>  $destinations
     * @return array<int|string, Distance> keyed like `$destinations`
     */
    public function fromOrigin(Coordinates $origin, array $destinations): array
    {
        $distances = [];
        $misses = [];
        foreach ($destinations as $key => $destination) {
            $cached = Cache::get($this->cacheKey($origin, $destination));
            if ($cached !== null) {
                $distances[$key] = new Distance($cached['km'], $cached['driveMinutes']);
            } else {
                $misses[$key] = $destination;
            }
        }

        if ($misses !== []) {
            $distances += $this->route($origin, $misses);
        }

        return array_replace(array_intersect_key($destinations, $distances), $distances);
    }

    /**
     * @param  array<int|string, Coordinates>  $destinations
     * @return array<int|string, Distance>
     */
    private function route(Coordinates $origin, array $destinations): array
    {
        try {
            $legs = $this->routing->matrix($origin, array_values($destinations));
        } catch (RoutingUnavailable $e) {
            Log::warning('routing.unavailable', ['reason' => $e->getMessage(), 'destinations' => count($destinations)]);

            return array_map(fn (Coordinates $destination) => $this->estimate($origin, $destination), $destinations);
        }

        $distances = [];
        foreach (array_keys($destinations) as $index => $key) {
            $distance = Distance::fromRoute($legs[$index]['metres'], $legs[$index]['seconds']);
            Cache::put(
                $this->cacheKey($origin, $destinations[$key]),
                ['km' => $distance->km, 'driveMinutes' => $distance->driveMinutes],
                now()->addDays(self::CACHE_DAYS),
            );
            $distances[$key] = $distance;
        }

        return $distances;
    }

    private function estimate(Coordinates $origin, Coordinates $destination): Distance
    {
        $km = $origin->straightLineKmTo($destination) * self::STRAIGHT_LINE_FACTOR;

        return Distance::fromRoute((int) round($km * 1000), (int) round($km / self::ESTIMATE_KM_PER_HOUR * 3600), approximate: true);
    }

    /** The same key whichever way round the pair is asked. */
    private function cacheKey(Coordinates $a, Coordinates $b): string
    {
        $pair = [$a->key(), $b->key()];
        sort($pair);

        return 'distance:'.implode('|', $pair);
    }
}
