<?php

namespace App\Support\Problems;

use App\Actions\ArtistProfiles\ArtistMoved;
use App\Actions\ArtistProfiles\ArtistNotFound;
use App\Http\Resources\Discovery\LineupCardResource;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
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

        if ($e instanceof NotFoundHttpException || $e instanceof ModelNotFoundException) {
            return ProblemDetails::of(ProblemType::NotFound, 'Nothing exists at this address.', $requestId)
                ->toResponse();
        }

        if ($e instanceof ValidationException) {
            return ProblemDetails::of(ProblemType::ValidationFailed, 'Some fields need attention.', $requestId, $e->errors())
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
