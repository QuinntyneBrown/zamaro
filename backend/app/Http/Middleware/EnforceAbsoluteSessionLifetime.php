<?php

namespace App\Http\Middleware;

use App\Actions\Accounts\SignOut;
use App\Support\SessionLifetimePolicy;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ends a session 30 days after sign-in, however active it has been (L2-073.3). It runs on the api
 * group after the session has started: the person is signed out, the session destroyed and the
 * request answered 401, so Zamaro Web sends them to sign in again. The next request is a guest's.
 */
class EnforceAbsoluteSessionLifetime
{
    public function __construct(
        private readonly SessionLifetimePolicy $policy,
        private readonly SignOut $signOut,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->hasSession() && ($user = Auth::guard('web')->user())) {
            if ($this->policy->hasExpired($user, $request->session()->get('auth.started_at'))) {
                $this->signOut->handle($request);

                throw new AuthenticationException('The session reached its 30-day limit.');
            }
        }

        return $next($request);
    }
}
