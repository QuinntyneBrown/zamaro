<?php

namespace App\Http\Middleware;

use App\Actions\Accounts\SignOut;
use App\Enums\Role;
use App\Services\Administration\AdminSession;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * An administrator's session ends after 30 minutes without a request, on any route, not only the
 * admin ones (L2-066.2). It runs on the api group after the session has started, like the 30-day
 * limit: past the limit the session is destroyed and the request answered 401, so the admin app sends
 * them to sign in again; within it the request counts as activity. Bookers and artists keep the
 * limits in L2-073.
 */
class EnforceAdminIdleTimeout
{
    public function __construct(
        private readonly AdminSession $session,
        private readonly SignOut $signOut,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->hasSession() && ($user = Auth::guard('web')->user()) && in_array(Role::Administrator, $user->roleNames(), true)) {
            if ($this->session->hasIdledOut($request)) {
                $this->signOut->handle($request);

                throw new AuthenticationException('The administrator session was idle for 30 minutes.');
            }
            $this->session->touch($request);
        }

        return $next($request);
    }
}
