<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A body over 1 MB is refused with 413 before anything reads it (L2-075.4). First on the api group.
 * Upload routes carry their own limit as `uploads:{kilobytes}` (AcceptsUpload); their size rules give
 * the person a message before this hard cap would.
 */
class LimitRequestBodySize
{
    public const MAX_BYTES = 1_048_576;

    public function handle(Request $request, Closure $next): Response
    {
        $declared = $request->headers->get('Content-Length');
        // Without a declared length (a chunked body) the body itself is measured.
        $size = $declared !== null ? (int) $declared : strlen($request->getContent());

        abort_if($size > (AcceptsUpload::limitFor($request->route()) ?? self::MAX_BYTES), 413);

        return $next($request);
    }
}
