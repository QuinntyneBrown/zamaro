<?php

namespace App\Http\Middleware;

use App\Services\Accounts\SessionRegistry;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps the signed-in devices list's last-active times current (L2-025.3), writing at most every 5
 * minutes per session (M2 D12).
 */
class TrackSessionActivity
{
    public function __construct(private readonly SessionRegistry $registry) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() !== null && $request->hasSession()) {
            $this->registry->touch($request);
        }

        return $next($request);
    }
}
