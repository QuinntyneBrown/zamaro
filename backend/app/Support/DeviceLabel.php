<?php

namespace App\Support;

/**
 * "Chrome on Windows" from a browser's user agent, for the signed-in devices list (L2-025.3). Order
 * matters: Edge and Chrome both say "Safari", and every iPhone browser says "Mac OS X".
 */
final class DeviceLabel
{
    /** @var array<string, string> pattern => browser */
    private const BROWSERS = [
        '/Edg(e|A|iOS)?\//' => 'Edge',
        '/(Firefox|FxiOS)\//' => 'Firefox',
        '/(Headless)?Chrome\/|CriOS\//' => 'Chrome',
        '/Version\/[\d.]+.*Safari\//' => 'Safari',
    ];

    /** @var array<string, string> pattern => system */
    private const SYSTEMS = [
        '/iPhone/' => 'iPhone',
        '/iPad/' => 'iPad',
        '/Android/' => 'Android',
        '/Windows NT/' => 'Windows',
        '/Macintosh|Mac OS X/' => 'Mac',
        '/CrOS/' => 'ChromeOS',
        '/Linux|X11/' => 'Linux',
    ];

    public const UNKNOWN = 'Unknown device';

    public static function fromUserAgent(?string $agent): string
    {
        $browser = self::first(self::BROWSERS, $agent ?? '');
        $system = self::first(self::SYSTEMS, $agent ?? '');

        return $browser !== null && $system !== null ? "{$browser} on {$system}" : self::UNKNOWN;
    }

    /** @param  array<string, string>  $patterns */
    private static function first(array $patterns, string $agent): ?string
    {
        foreach ($patterns as $pattern => $name) {
            if (preg_match($pattern, $agent)) {
                return $name;
            }
        }

        return null;
    }
}
