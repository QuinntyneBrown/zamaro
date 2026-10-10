<?php

namespace App\Integrations\Routing;

use App\Contracts\RoutingProvider;
use App\Contracts\RoutingUnavailable;
use App\Services\Discovery\Coordinates;

/**
 * Deterministic router for development and tests (ADR-0002). A point within 2 km of a CastRoutes
 * anchor snaps to it; known anchor pairs use the mock's road distance, anything else straight-line
 * distance x 1.25. Drive time assumes 80 km/h, matching the radius labels ("120 km · 1.5 hr").
 */
class FakeRoutingProvider implements RoutingProvider
{
    private const SNAP_KM = 2.0;

    private const ROAD_FACTOR = 1.25;

    private const KM_PER_HOUR = 80;

    /** @var array<string, float> */
    private array $overrides = [];

    private ?RoutingUnavailable $failure = null;

    private int $calls = 0;

    public function matrix(Coordinates $origin, array $destinations): array
    {
        $this->calls++;
        if ($this->failure) {
            throw $this->failure;
        }

        return array_map(function (Coordinates $destination) use ($origin) {
            $km = $this->roadKm($origin, $destination);

            return ['metres' => (int) round($km * 1000), 'seconds' => (int) round($km / self::KM_PER_HOUR * 3600)];
        }, $destinations);
    }

    /** Test hook: the road distance between two points, whichever way round they are asked. */
    public function override(Coordinates $from, Coordinates $to, float $km): void
    {
        $this->overrides[$this->pairKey($from, $to)] = $km;
    }

    /** Test hook: every call fails until recover() (as the vendor timing out). */
    public function failWith(RoutingUnavailable $failure): void
    {
        $this->failure = $failure;
    }

    public function recover(): void
    {
        $this->failure = null;
    }

    /** Test hook: how many matrix calls were made. */
    public function calls(): int
    {
        return $this->calls;
    }

    private function roadKm(Coordinates $from, Coordinates $to): float
    {
        if (isset($this->overrides[$this->pairKey($from, $to)])) {
            return $this->overrides[$this->pairKey($from, $to)];
        }

        $a = $this->snap($from);
        $b = $this->snap($to);
        if ($a !== null && $b !== null) {
            foreach (CastRoutes::ROAD_KM as [$x, $y, $km]) {
                if (($x === $a && $y === $b) || ($x === $b && $y === $a)) {
                    return $km;
                }
            }
        }

        return $from->straightLineKmTo($to) * self::ROAD_FACTOR;
    }

    private function snap(Coordinates $point): ?string
    {
        foreach (array_keys(CastRoutes::ANCHORS) as $place) {
            if ($point->straightLineKmTo(CastRoutes::anchor($place)) <= self::SNAP_KM) {
                return $place;
            }
        }

        return null;
    }

    private function pairKey(Coordinates $a, Coordinates $b): string
    {
        $keys = [$a->key(), $b->key()];
        sort($keys);

        return implode('|', $keys);
    }
}
