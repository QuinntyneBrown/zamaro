<?php

namespace App\Support\OpenApi;

use Dedoc\Scramble\Extensions\OperationExtension;
use Dedoc\Scramble\Support\Generator\Operation;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\RouteInfo;

/**
 * Documents the 419 every state-changing call can get from Zamaro Web: the session middleware
 * checks X-XSRF-TOKEN before any controller runs, so no controller code shows it (L2-073.2).
 */
class CsrfMismatchResponses extends OperationExtension
{
    public function handle(Operation $operation, RouteInfo $routeInfo)
    {
        if (! in_array(strtoupper($operation->method), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return;
        }

        $operation->addResponse(Response::make(419)
            ->setDescription('`csrf-token-mismatch`: X-XSRF-TOKEN is missing or does not match the session. Nothing changed; fetch /sanctum/csrf-cookie and repeat the request.')
            ->setContent('application/problem+json', Schema::fromType(ProblemDetailsResponses::problemBody())));
    }
}
