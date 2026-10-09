<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Writes one structured line per request after the response is sent, so handled errors log their
 * final status. The request ID arrives through Context (see AssignRequestId).
 */
class LogRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $startedAt = $request->server('REQUEST_TIME_FLOAT') ?? (defined('LARAVEL_START') ? LARAVEL_START : microtime(true));

        Log::info('request', [
            'method' => $request->method(),
            'route' => $request->route()?->uri(),
            'status' => $response->getStatusCode(),
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            'release' => config('zamaro.release'),
        ]);
    }
}
