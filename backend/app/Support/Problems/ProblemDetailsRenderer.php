<?php

namespace App\Support\Problems;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Renders every exception as application/problem+json. Internals never reach the body.
 */
class ProblemDetailsRenderer
{
    public function __invoke(Throwable $e, Request $request): JsonResponse
    {
        $requestId = Context::get('request_id');

        if ($e instanceof NotFoundHttpException || $e instanceof ModelNotFoundException) {
            return ProblemDetails::of(ProblemType::NotFound, 'Nothing exists at this address.', $requestId)
                ->toResponse();
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
}
