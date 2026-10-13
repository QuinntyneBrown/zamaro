<?php

namespace App\Support\Problems;

use App\Actions\Accounts\LinkExpired;
use App\Actions\Accounts\SavedArtistLimit;
use App\Actions\Accounts\SignInPaused;
use App\Actions\Accounts\TwoFactorAlreadyOn;
use App\Actions\Accounts\TwoFactorRequired;
use App\Actions\ArtistOnboarding\VscAlreadyDecided;
use App\Actions\ArtistProfiles\ArtistMoved;
use App\Actions\ArtistProfiles\ArtistNotFound;
use App\Actions\Privacy\LegalDocumentOutdated;
use App\Actions\Privacy\TermsAcceptanceRequired;
use App\Http\Resources\Discovery\LineupCardResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Routing\Exceptions\InvalidSignatureException;
use Illuminate\Support\Facades\Context;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

/**
 * Renders every exception as application/problem+json. Internals never reach the body. The one
 * exception that is not an error, a renamed artist, is a bodiless 301.
 */
class ProblemDetailsRenderer
{
    public function __invoke(Throwable $e, Request $request): Response
    {
        $requestId = Context::get('request_id');

        if ($e instanceof ArtistMoved) {
            return $this->movedTo($e->currentSlug, $request);
        }

        if ($e instanceof ArtistNotFound) {
            $similar = $e->similarArtists;

            return ProblemDetails::of(ProblemType::ArtistNotFound, 'No artist has that address.', $requestId, extensions: $similar === null ? [] : [
                'similarArtists' => [
                    'date' => $similar->date->toDateString(),
                    'radiusKm' => $similar->radiusKm,
                    'items' => LineupCardResource::collection($similar->cards)->resolve($request),
                ],
            ])->toResponse();
        }

        if ($e instanceof AuthenticationException) {
            return ProblemDetails::of(ProblemType::Unauthenticated, 'This needs a signed-in account.', $requestId)
                ->toResponse();
        }

        // Laravel turns a TokenMismatchException into this 419 before rendering. Nothing changed.
        if ($e instanceof HttpExceptionInterface && $e->getStatusCode() === 419) {
            return ProblemDetails::of(ProblemType::CsrfTokenMismatch, 'Fetch /sanctum/csrf-cookie, then repeat the request with X-XSRF-TOKEN.', $requestId)
                ->toResponse();
        }

        // A policy's denyAsNotFound() (L2-074), and a signed link that was altered or ran out (L2-076.3), are
        // the same "nothing here" as an unknown address.
        if ($e instanceof NotFoundHttpException || $e instanceof ModelNotFoundException || $e instanceof InvalidSignatureException
            || ($e instanceof HttpExceptionInterface && $e->getStatusCode() === 404)) {
            return ProblemDetails::of(ProblemType::NotFound, 'Nothing exists at this address.', $requestId)
                ->toResponse();
        }

        if ($e instanceof ValidationException) {
            return ProblemDetails::of(ProblemType::ValidationFailed, 'Some fields need attention.', $requestId, $e->errors())
                ->toResponse();
        }

        if ($e instanceof TermsAcceptanceRequired) {
            return ProblemDetails::of(ProblemType::TermsAcceptanceRequired, 'Fetch /legal-documents/current and accept the terms at /account/consents/terms first.', $requestId)->toResponse();
        }

        if ($e instanceof LegalDocumentOutdated) {
            return ProblemDetails::of(ProblemType::LegalDocumentOutdated, 'Fetch /legal-documents/current, show the new versions, then submit again.', $requestId)
                ->toResponse();
        }

        if ($e instanceof SavedArtistLimit) {
            return ProblemDetails::of(ProblemType::SavedArtistLimit, 'Remove a saved artist to make room.', $requestId)->toResponse();
        }

        if ($e instanceof TwoFactorAlreadyOn) {
            return ProblemDetails::of(ProblemType::TwoFactorAlreadyOn, 'Turn it off first to set up a new key.', $requestId)->toResponse();
        }

        if ($e instanceof TwoFactorRequired) {
            return ProblemDetails::of(ProblemType::TwoFactorRequired, 'An administrator signs in with a code every time; two-step sign-in cannot be turned off.', $requestId)->toResponse();
        }

        if ($e instanceof VscAlreadyDecided) {
            return ProblemDetails::of(ProblemType::VscAlreadyDecided, 'Another administrator decided this check first. Reload the queue.', $requestId)->toResponse();
        }

        if ($e instanceof LinkExpired) {
            return ProblemDetails::of(ProblemType::LinkExpired, 'Links work once, for a limited time. Ask for a new one.', $requestId, extensions: $e->extensions())
                ->toResponse();
        }

        if ($e instanceof SignInPaused) {
            return ProblemDetails::of(ProblemType::SignInPaused, 'There were too many tries for this email. Try again later, or reset the password.', $requestId, extensions: [
                'pausedUntil' => $e->pausedUntil->setTimezone(config('app.timezone'))->toIso8601String(),
            ])->toResponse($e->getHeaders());
        }

        // LimitRequestBodySize, and PHP's own post size check, both answer 413 (L2-075.4).
        if ($e instanceof HttpExceptionInterface && $e->getStatusCode() === 413) {
            return ProblemDetails::of(ProblemType::PayloadTooLarge, 'Send at most 1 MB.', $requestId)
                ->toResponse();
        }

        if ($e instanceof HttpExceptionInterface && $e->getStatusCode() === 415) {
            return ProblemDetails::of(ProblemType::UnsupportedMediaType, 'Send the body as application/json.', $requestId)
                ->toResponse();
        }

        if ($e instanceof TooManyRequestsHttpException) {
            return ProblemDetails::of(ProblemType::TooManyRequests, 'Wait for Retry-After seconds, then try again.', $requestId)
                ->toResponse($e->getHeaders());
        }

        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
            $title = Response::$statusTexts[$status] ?? 'Error';

            return (new ProblemDetails('about:blank', $title, $status, $title.'.', $requestId))
                ->toResponse($e->getHeaders());
        }

        return ProblemDetails::of(ProblemType::ServerError, 'The server could not complete the request.', $requestId)
            ->toResponse();
    }

    /**
     * The same route under the artist's current slug, relative so it works behind any proxy, with
     * the query string kept (L2-021.3).
     */
    private function movedTo(string $slug, Request $request): Response
    {
        $route = $request->route();
        $location = route($route->getName(), ['slug' => $slug] + $route->parameters(), false);
        $query = $request->getQueryString();

        return new Response('', 301, ['Location' => $query === null ? $location : "{$location}?{$query}"]);
    }
}
