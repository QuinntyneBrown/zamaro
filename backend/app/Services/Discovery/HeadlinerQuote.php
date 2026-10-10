<?php

namespace App\Services\Discovery;

/** The headliner's most recent visible 5-star review, cut to 160 characters at a word boundary. */
final class HeadlinerQuote
{
    public const MAX_LENGTH = 160;

    public function __construct(
        public readonly string $text,
        public readonly string $reviewerName,
        public readonly string $city,
    ) {}

    public static function excerpt(string $text): string
    {
        if (mb_strlen($text) <= self::MAX_LENGTH) {
            return $text;
        }
        $cut = mb_substr($text, 0, self::MAX_LENGTH);
        $lastSpace = mb_strrpos($cut, ' ');

        return mb_substr($text, 0, $lastSpace === false ? self::MAX_LENGTH : $lastSpace).'…';
    }
}
