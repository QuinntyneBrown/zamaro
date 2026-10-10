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
        return $this->withHeader('Referer', 'http://localhost:4200/');
    }

    protected function signIn(string $email, ?string $password = null): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/session', [
            'email' => $email,
            'password' => $password ?? config('zamaro.cast_password'),
        ]);
    }
}
