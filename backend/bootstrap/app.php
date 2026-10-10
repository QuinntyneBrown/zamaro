<?php

use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\LogRequest;
use App\Support\Problems\ProblemDetailsRenderer;
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
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // The app is API-only: every error is RFC 9457 problem details (L2-095.2).
        $exceptions->render(fn (Throwable $e, $request) => app(ProblemDetailsRenderer::class)($e, $request));
    })->create();
