<?php

namespace App\Support\Problems;

/**
 * The RFC 9457 problem types the API returns. Errors without extra semantics use `about:blank`.
 */
enum ProblemType: string
{
    case NotFound = 'not-found';
    case ServerError = 'server-error';

    public function uri(): string
    {
        return config('zamaro.problems.base_uri').'/'.$this->value;
    }

    public function status(): int
    {
        return match ($this) {
            self::NotFound => 404,
            self::ServerError => 500,
        };
    }

    public function title(): string
    {
        return match ($this) {
            self::NotFound => 'Not found',
            self::ServerError => 'Something went wrong',
        };
    }
}
