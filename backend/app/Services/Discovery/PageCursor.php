<?php

namespace App\Services\Discovery;

use App\Enums\SearchSort;

/**
 * An opaque, URL-safe position in the lineup: the sort and the sort key of the last ticket
 * returned (L2-095.1). A cursor from another sort does not decode.
 */
final class PageCursor
{
    /**
     * @param  list<int|float>  $after
     */
    public static function encode(SearchSort $sort, array $after): string
    {
        return rtrim(strtr(base64_encode(json_encode(['s' => $sort->value, 'k' => $after])), '+/', '-_'), '=');
    }

    /**
     * @return list<int|float>|null the sort key to continue after, or null when it does not decode
     */
    public static function decode(string $cursor, SearchSort $sort): ?array
    {
        $json = base64_decode(strtr($cursor, '-_', '+/'), true);
        $data = $json === false ? null : json_decode($json, true);
        if (! is_array($data) || ($data['s'] ?? null) !== $sort->value || ! is_array($data['k'] ?? null)) {
            return null;
        }
        foreach ($data['k'] as $part) {
            if (! is_int($part) && ! is_float($part)) {
                return null;
            }
        }

        return array_values($data['k']);
    }
}
