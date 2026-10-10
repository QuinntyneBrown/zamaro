<?php

namespace App\Support\Problems;

/**
 * The RFC 9457 problem types the API returns. Errors without extra semantics use `about:blank`.
 */
enum ProblemType: string
{
    case Unauthenticated = 'unauthenticated';
    case CsrfTokenMismatch = 'csrf-token-mismatch';
    case NotFound = 'not-found';
    case ArtistNotFound = 'artist-not-found';
    case ValidationFailed = 'validation-failed';
    case PayloadTooLarge = 'payload-too-large';
    case UnsupportedMediaType = 'unsupported-media-type';
    case LegalDocumentOutdated = 'legal-document-outdated';
    case TooManyRequests = 'too-many-requests';
    case ServerError = 'server-error';

    public function uri(): string
    {
        return config('zamaro.problems.base_uri').'/'.$this->value;
    }

    public function status(): int
    {
        return match ($this) {
            self::Unauthenticated => 401,
            self::CsrfTokenMismatch => 419,
            self::NotFound, self::ArtistNotFound => 404,
            self::ValidationFailed => 422,
            self::PayloadTooLarge => 413,
            self::UnsupportedMediaType => 415,
            self::LegalDocumentOutdated => 409,
            self::TooManyRequests => 429,
            self::ServerError => 500,
        };
    }

    public function title(): string
    {
        return match ($this) {
            self::Unauthenticated => 'Sign in to continue',
            self::CsrfTokenMismatch => 'The page’s security token didn’t match',
            self::NotFound => 'Not found',
            self::ArtistNotFound => 'This artist isn’t on Zamaro',
            self::ValidationFailed => 'Check the highlighted fields',
            self::PayloadTooLarge => 'The request is too large',
            self::UnsupportedMediaType => 'Send the request as JSON',
            self::LegalDocumentOutdated => 'The terms have changed',
            self::TooManyRequests => 'Too many requests',
            self::ServerError => 'Something went wrong',
        };
    }
}
