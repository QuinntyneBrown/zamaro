<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The API accepts JSON: a request with a body of any other type is refused with 415 (L2-095.1). A
 * request with no body, such as signing out, needs no Content-Type.
 */
class EnsureJsonRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if($request->getContent() !== '' && ! $request->isJson(), 415);

        return $next($request);
    }
}
