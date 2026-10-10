<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Responses that may hold personal data are private and never stored by any cache (L2-089.3). It
 * runs on every route in routes/api.php and on anonymous routes that answer with an account.
 */
class SetCachePolicy
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }
}
