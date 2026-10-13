<?php

namespace App\Support;

/** Where an emailed link returns to: a path on the site, never another site; anything else is Discover. */
final class ReturnUrl
{
    public static function orDiscover(?string $url): string
    {
        return $url !== null && str_starts_with($url, '/') && ! str_starts_with($url, '//') && ! str_contains($url, '\\')
            ? $url
            : '/';
    }
}
