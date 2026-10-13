<?php

namespace App\Integrations\IpLocation;

use App\Contracts\IpLocator;
use Symfony\Component\HttpFoundation\IpUtils;

/**
 * Deterministic locator for development and tests (ADR-0002, M2 D13): loopback and the 172.16/12 and
 * 192.168/16 private ranges are in Burlington, 10/8 in Hamilton, and every other address is unknown.
 */
class FakeIpLocator implements IpLocator
{
    /** @var array<string, list<string>> */
    private const CITIES = [
        'Burlington, ON' => ['127.0.0.0/8', '::1', '172.16.0.0/12', '192.168.0.0/16'],
        'Hamilton, ON' => ['10.0.0.0/8'],
    ];

    public function city(?string $ip): ?string
    {
        if ($ip === null) {
            return null;
        }
        foreach (self::CITIES as $city => $ranges) {
            if (IpUtils::checkIp($ip, $ranges)) {
                return $city;
            }
        }

        return null;
    }
}
