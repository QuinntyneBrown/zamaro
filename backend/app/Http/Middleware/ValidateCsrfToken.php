<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

/**
 * Every state-changing request from Zamaro Web repeats the session's CSRF token in X-XSRF-TOKEN
 * (L2-073.2). Laravel 13 also accepts a request marked `Sec-Fetch-Site: same-origin` without one;
 * Zamaro does not, so the token is the one rule for every browser (ADR-0018).
 */
class ValidateCsrfToken extends PreventRequestForgery
{
    protected function hasValidOrigin($request)
    {
        return false;
    }
}
