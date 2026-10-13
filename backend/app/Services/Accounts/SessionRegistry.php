<?php

namespace App\Services\Accounts;

use App\Contracts\IpLocator;
use App\Models\User;
use App\Models\UserSession;
use App\Support\DeviceLabel;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Session\SessionManager;

/**
 * Every signed-in session of an account (accounts/sign-in-and-recover-access), so one can be ended
 * from elsewhere: a password reset ends them all (L2-023.4). Rows are keyed by the SHA-256 of the
 * session ID; the ID is kept encrypted only to destroy the session's payload.
 */
class SessionRegistry
{
    /** Activity is written at most this often, so a busy session does not write on every request (M2 D12). */
    public const TOUCH_EVERY_MINUTES = 5;

    public function __construct(private readonly SessionManager $sessions, private readonly IpLocator $locator) {}

    /** The browser's session, just started for `$user`, with its device and approximate city. */
    public function register(User $user, Request $request): void
    {
        $id = $request->session()->getId();
        UserSession::create([
            'id' => self::key($id),
            'user_id' => $user->id,
            'encrypted_session_id' => $id,
            'device_label' => DeviceLabel::fromUserAgent($request->userAgent()),
            'approximate_city' => $this->locator->city($request->ip()),
            'ip_address' => $request->ip(),
            'last_active_at' => now(),
        ]);
    }

    /**
     * The account's sessions still within their idle lifetime: this browser's first, then the most
     * recently active.
     *
     * @return Collection<int, UserSession>
     */
    public function active(User $user, Request $request): Collection
    {
        $current = self::key($request->session()->getId());

        return UserSession::where('user_id', $user->id)
            // Query bindings drop the offset; ISO 8601 keeps it for the timestamptz column.
            ->where('last_active_at', '>=', now()->subMinutes((int) config('session.lifetime'))->toIso8601String())
            ->orderByRaw('id = ? desc', [$current])
            ->orderByDesc('last_active_at')
            ->get()
            ->each(fn (UserSession $session) => $session->is_current = $session->id === $current);
    }

    /** Ends one of `$user`'s sessions at once; false when they hold no session by that key. */
    public function end(User $user, string $key): bool
    {
        $session = UserSession::where('user_id', $user->id)->whereKey($key)->first();
        if ($session === null) {
            return false;
        }
        $this->sessions->driver()->getHandler()->destroy($session->encrypted_session_id);
        $session->delete();

        return true;
    }

    /** Records that the browser's session is in use, at most every 5 minutes. */
    public function touch(Request $request): void
    {
        UserSession::whereKey(self::key($request->session()->getId()))
            ->where('last_active_at', '<=', now()->subMinutes(self::TOUCH_EVERY_MINUTES)->toIso8601String())
            ->update(['last_active_at' => now()->toIso8601String()]);
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
