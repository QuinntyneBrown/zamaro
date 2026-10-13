<?php

namespace App\Actions\Accounts;

use App\Services\Accounts\SessionRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Signs a person out of this browser (L2-023.5). The session is destroyed on the server, so the
 * cookie the browser held is worth nothing afterwards, and the CSRF token is rotated with it. The
 * session leaves the account's registry.
 */
class SignOut
{
    public function __construct(private readonly SessionRegistry $registry) {}

    public function handle(Request $request): void
    {
        $this->registry->forget($request);
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
