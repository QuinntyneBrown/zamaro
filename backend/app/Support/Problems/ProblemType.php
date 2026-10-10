<?php

namespace App\Support\Problems;

/**
 * The RFC 9457 problem types the API returns. Errors without extra semantics use `about:blank`.
 */
enum ProblemType: string
{
    case NotFound = 'not-found';
    case ArtistNotFound = 'artist-not-found';
    case ValidationFailed = 'validation-failed';
    case TooManyRequests = 'too-many-requests';
    case ServerError = 'server-error';

    public function uri(): string
    {
        return config('zamaro.problems.base_uri').'/'.$this->value;
    }

    public function status(): int
    {
        return match ($this) {
            self::NotFound, self::ArtistNotFound => 404,
            self::ValidationFailed => 422,
            self::TooManyRequests => 429,
            self::ServerError => 500,
        };
    }

    public function title(): string
    {
        return match ($this) {
            self::NotFound => 'Not found',
            self::ArtistNotFound => 'This artist isn’t on Zamaro',
            self::ValidationFailed => 'Check the highlighted fields',
            self::TooManyRequests => 'Too many requests',
            self::ServerError => 'Something went wrong',
        };
    }
}
