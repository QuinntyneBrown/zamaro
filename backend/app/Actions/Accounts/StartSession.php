<?php

namespace App\Actions\Accounts;

use App\Models\User;
use App\Services\Accounts\SessionRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Signs a person in on this browser. The session gets a new ID, so one known before sign-in is
 * useless after it (session fixation, L2-073.1), and a new CSRF token. `auth.started_at` is when
 * the 30-day absolute limit starts (security/manage-sessions-and-csrf). The session joins the
 * account's registry, so a password reset can end it from elsewhere.
 */
class StartSession
{
    public function __construct(private readonly SessionRegistry $registry) {}

    public function handle(User $user, Request $request): User
    {
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->regenerateToken();
        $request->session()->put('auth.started_at', now()->getTimestamp());
        $this->registry->register($user, $request);

        return $user;
    }
}
