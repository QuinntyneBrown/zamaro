<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * `uploads:{kilobytes}` marks a route that takes a `multipart/form-data` body up to that size instead
 * of the 1 MB JSON limit (L2-075.4). LimitRequestBodySize and EnsureJsonRequest, which run before any
 * route middleware, read the mark from the matched route; the middleware itself changes nothing.
 */
class AcceptsUpload
{
    public function handle(Request $request, Closure $next, string $kilobytes): Response
    {
        return $next($request);
    }

    /** The route's upload limit in bytes, or null for an ordinary JSON route. */
    public static function limitFor(?Route $route): ?int
    {
        foreach ($route?->middleware() ?? [] as $middleware) {
            if (is_string($middleware) && str_starts_with($middleware, 'uploads:')) {
                return (int) Str::after($middleware, 'uploads:') * 1024;
            }
        }

        return null;
    }
}
