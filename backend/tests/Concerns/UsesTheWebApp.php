<?php

namespace Tests\Concerns;

use Illuminate\Testing\TestResponse;

/**
 * Requests as Zamaro Web sends them. Sanctum only starts a session for a request whose `Referer` or
 * `Origin` is one of ZAMARO_WEB_ORIGINS (ADR-0015).
 */
trait UsesTheWebApp
{
    protected function fromTheWebApp(): static
    {
        // A JSON test request sends its cookies only with credentials, as the browser's same-origin fetch does.
        return $this->withHeader('Referer', 'http://localhost:4200/')->withCredentials();
    }

    /**
     * The next request is known only by the cookies it carries. Within one test the app keeps the
     * signed-in user and the last session's data in memory; forgetting both makes it read the session
     * store again by the cookie's ID, as a new request would.
     */
    protected function asANewRequest(): static
    {
        $this->app['auth']->forgetGuards();
        $this->app['session.store']->flush();

        return $this;
    }

    /** The next request comes from another browser: none of the cookies set so far go with it. */
    protected function withoutCookies(): static
    {
        $this->defaultCookies = [];
        $this->unencryptedCookies = [];

        return $this;
    }

    protected function signIn(string $email, ?string $password = null): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/session', [
            'email' => $email,
            'password' => $password ?? config('zamaro.cast_password'),
        ]);
    }
}
