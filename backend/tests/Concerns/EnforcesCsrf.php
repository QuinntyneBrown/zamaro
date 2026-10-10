<?php

namespace Tests\Concerns;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Testing\TestResponse;

/**
 * Laravel skips the CSRF check while unit tests run. These tests switch it back on, so a request
 * without the token meets the same middleware a browser's would (L2-073.2).
 */
trait EnforcesCsrf
{
    protected function enforceCsrf(): void
    {
        $this->app->bind(ValidateCsrfToken::class, fn ($app) => new class($app, $app['encrypter']) extends ValidateCsrfToken
        {
            protected function runningUnitTests()
            {
                return false;
            }
        });
    }

    /** The XSRF-TOKEN cookie as the browser holds it, which Zamaro Web repeats in X-XSRF-TOKEN. */
    protected function xsrfTokenFrom(TestResponse $response): string
    {
        return $response->getCookie('XSRF-TOKEN', decrypt: false)->getValue();
    }
}
