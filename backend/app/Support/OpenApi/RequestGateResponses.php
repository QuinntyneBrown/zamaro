<?php

namespace App\Support\OpenApi;

use App\Http\Middleware\EnsureCurrentTermsAccepted;
use Dedoc\Scramble\Extensions\OperationExtension;
use Dedoc\Scramble\Support\Generator\Operation;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\RouteInfo;

/**
 * Documents the answers the api group gives before any controller runs: 429 from the `api` limiter on
 * every route (L2-077.1), and 413 and 415 on calls that send a body (L2-075.4, L2-095.1).
 */
class RequestGateResponses extends OperationExtension
{
    public function handle(Operation $operation, RouteInfo $routeInfo)
    {
        $problem = fn (int $status, string $description) => Response::make($status)
            ->setDescription($description)
            ->setContent('application/problem+json', Schema::fromType(ProblemDetailsResponses::problemBody()));

        if (! $this->documents($operation, 429)) {
            $operation->addResponse($problem(429, '`too-many-requests`: over 120 requests a minute from one address, or 300 from one signed-in account. Wait for `Retry-After` seconds.'));
        }

        // The terms gate (L2-080.3) answers before the controller on every signed-in route but its open ones.
        $route = $routeInfo->route;
        if (in_array(EnsureCurrentTermsAccepted::class, $route->gatherMiddleware(), true)
            && ! in_array($route->getName(), EnsureCurrentTermsAccepted::OPEN, true)
            && ! $this->documents($operation, 409)) {
            $operation->addResponse($problem(409, '`terms-acceptance-required`: the current terms must be accepted first, at `POST /account/consents/terms`.'));
        }

        if (in_array(strtoupper($operation->method), ['POST', 'PUT', 'PATCH'], true)) {
            $operation->addResponse($problem(413, '`payload-too-large`: the body is over 1 MB.'));
            $operation->addResponse($problem(415, '`unsupported-media-type`: the body is not `application/json`.'));
        }
    }

    private function documents(Operation $operation, int $status): bool
    {
        foreach ($operation->responses ?? [] as $response) {
            if ($response instanceof Response && (int) $response->code === $status) {
                return true;
            }
        }

        return false;
    }
}
