<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * `role:artist`, `role:admin`: a signed-in person without one of the named roles gets the same 404 as
 * an address that does not exist, never 403, so the route's existence stays hidden (L2-074.1).
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $held = array_map(fn (Role $role) => $role->value, $request->user()?->roleNames() ?? []);

        abort_if(array_intersect($roles, $held) === [], 404);

        return $next($request);
    }
}
