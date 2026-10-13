<?php

namespace App\Http\Middleware;

use App\Services\Administration\AdminSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * After EnsureAdministrator: an administrator whose session has not passed the code step, because
 * two-step sign-in is not on yet, gets the same 404 as everyone else (L2-066.2).
 */
class EnsureMfaVerified
{
    public function __construct(private readonly AdminSession $session) {}

    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($this->session->isMfaVerified($request), 404);

        return $next($request);
    }
}
