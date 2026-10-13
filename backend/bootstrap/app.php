<?php

use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\EnforceAbsoluteSessionLifetime;
use App\Http\Middleware\EnforceAdminIdleTimeout;
use App\Http\Middleware\EnsureAdministrator;
use App\Http\Middleware\EnsureJsonRequest;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\LimitRequestBodySize;
use App\Http\Middleware\LogRequest;
use App\Http\Middleware\VerifyBotChallenge;
use App\Support\Problems\ProblemDetailsRenderer;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        apiPrefix: 'api/v1',
        then: function () {
            Route::middleware('api')->prefix('api/v1')->group(base_path('routes/api_public.php'));
            Route::group([], base_path('routes/health.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // AssignRequestId runs first so every log line and problem body carries the ID.
        // LogRequest is terminable, so it logs the final status after exceptions are rendered.
        $middleware->prepend(AssignRequestId::class);
        $middleware->append(LogRequest::class);
        // Same-origin cookie sessions (ADR-0015): requests from ZAMARO_WEB_ORIGINS get the session,
        // cookie encryption and CSRF middleware on the api group; other callers stay stateless.
        $middleware->statefulApi();
        // Before the session or any limiter: a body over 1 MB, or one that is not JSON, goes no further
        // (L2-075.4, L2-095.1).
        $middleware->api(prepend: [LimitRequestBodySize::class, EnsureJsonRequest::class]);
        // Every /api/v1 route, anonymous or not, counts toward the `api` limiter (L2-077.1).
        $middleware->throttleApi();
        // After the session has started: a session 30 days old ends here, whatever the route (L2-073.3),
        // and so does an administrator's after 30 minutes without a request (L2-066.2).
        $middleware->api(append: [EnforceAbsoluteSessionLifetime::class, EnforceAdminIdleTimeout::class]);
        // An API with no sign-in page to redirect to: a guest always gets the 401 problem.
        $middleware->redirectGuestsTo(fn () => null);
        // role:artist, role:admin: anyone without the role gets 404 (L2-074.1).
        // bot-challenge:{action}: the forms that send email to any address need a passing bot check (L2-077.4).
        $middleware->alias(['role' => EnsureUserHasRole::class, 'bot-challenge' => VerifyBotChallenge::class]);
        // Laravel runs authentication ahead of a route's own middleware; on the admin routes the role
        // check comes first, so a guest gets the same 404 as everyone without the role (L2-066.1).
        $middleware->prependToPriorityList(AuthenticatesRequests::class, EnsureAdministrator::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // The app is API-only: every error is RFC 9457 problem details (L2-095.2).
        $exceptions->render(fn (Throwable $e, $request) => app(ProblemDetailsRenderer::class)($e, $request));
    })->create();
