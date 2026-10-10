<?php

namespace App\Actions\Accounts;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Signs a person out of this browser (L2-023.5). The session is destroyed on the server, so the
 * cookie the browser held is worth nothing afterwards, and the CSRF token is rotated with it.
 */
class SignOut
{
    public function handle(Request $request): void
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
