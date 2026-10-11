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
    case TermsAcceptanceRequired = 'terms-acceptance-required';
    case LinkExpired = 'link-expired';
    case TwoFactorAlreadyOn = 'two-factor-already-on';
    case TooManyRequests = 'too-many-requests';
    case SignInPaused = 'sign-in-paused';
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
            self::LegalDocumentOutdated, self::TwoFactorAlreadyOn, self::TermsAcceptanceRequired => 409,
            self::LinkExpired => 410,
            self::TooManyRequests, self::SignInPaused => 429,
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
            self::TermsAcceptanceRequired => 'Accept the updated terms',
            self::LinkExpired => 'This link has expired',
            self::TwoFactorAlreadyOn => 'Two-step sign-in is already on',
            self::TooManyRequests => 'Too many requests',
            self::SignInPaused => 'Sign-in is paused for 15 minutes',
            self::ServerError => 'Something went wrong',
        };
    }
}
