<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * First on every /api/v1/admin route, ahead of authentication: a guest, or anyone without the
 * Administrator role, gets the same 404 as an address that does not exist, never 401 or 403, so
 * nothing says the route is there (L2-066.1, L2-074.1).
 */
class EnsureAdministrator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('sanctum')->user();

        abort_unless($user !== null && in_array(Role::Administrator, $user->roleNames(), true), 404);

        return $next($request);
    }
}
