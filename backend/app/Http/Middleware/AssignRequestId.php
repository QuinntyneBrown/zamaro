<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs first: gives every request an ID that logs, queued jobs and problem bodies share (L2-093.1).
 */
class AssignRequestId
{
    public const HEADER = 'X-Request-Id';

    public function handle(Request $request, Closure $next): Response
    {
        $inbound = $request->headers->get(self::HEADER);
        $id = is_string($inbound) && Str::isUuid($inbound) ? $inbound : (string) Str::uuid();

        Context::add('request_id', $id);

        $response = $next($request);
        $response->headers->set(self::HEADER, $id);

        return $response;
    }
}
