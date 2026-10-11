<?php

namespace App\Services\Accounts;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Session\SessionManager;

/**
 * Every signed-in session of an account (accounts/sign-in-and-recover-access), so one can be ended
 * from elsewhere: a password reset ends them all (L2-023.4). Rows are keyed by the SHA-256 of the
 * session ID; the ID is kept encrypted only to destroy the session's payload.
 */
class SessionRegistry
{
    public function __construct(private readonly SessionManager $sessions) {}

    /** The browser's session, just started for `$user`. */
    public function register(User $user, Request $request): void
    {
        $id = $request->session()->getId();
        UserSession::create([
            'id' => self::key($id),
            'user_id' => $user->id,
            'encrypted_session_id' => $id,
            'ip_address' => $request->ip(),
            'last_active_at' => now(),
        ]);
    }

    /** The browser's session is ending. */
    public function forget(Request $request): void
    {
        UserSession::whereKey(self::key($request->session()->getId()))->delete();
    }

    /** Ends every session of `$user`: each one's payload is destroyed, so its cookie is worth nothing. */
    public function endAll(User $user): void
    {
        $handler = $this->sessions->driver()->getHandler();
        foreach (UserSession::where('user_id', $user->id)->get() as $session) {
            $handler->destroy($session->encrypted_session_id);
            $session->delete();
        }
    }

    private static function key(string $sessionId): string
    {
        return hash('sha256', $sessionId);
    }
}
