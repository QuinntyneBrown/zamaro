<?php

namespace App\Services\Administration;

use Illuminate\Http\Request;

/**
 * The two marks an administrator's session carries (administration/secure-admin-access): when its
 * code step was passed, and when it last made a request. Both live in the session, so they go when
 * the session does, and both are read by the admin route group's middleware.
 */
class AdminSession
{
    public const MFA_VERIFIED_AT = 'admin.mfa_verified_at';

    public const LAST_ACTIVITY_AT = 'admin.last_activity_at';

    /** The code step was passed on this session, now (L2-066.2). */
    public function markMfaVerified(Request $request): void
    {
        $request->session()->put(self::MFA_VERIFIED_AT, now()->getTimestamp());
        $this->touch($request);
    }

    public function isMfaVerified(Request $request): bool
    {
        return $request->hasSession() && $request->session()->has(self::MFA_VERIFIED_AT);
    }

    /** The session made a request, now. */
    public function touch(Request $request): void
    {
        $request->session()->put(self::LAST_ACTIVITY_AT, now()->getTimestamp());
    }

    /** Whether more than the idle limit has passed since the last request; a session never stamped has not. */
    public function hasIdledOut(Request $request): bool
    {
        $last = $request->session()->get(self::LAST_ACTIVITY_AT);

        return is_int($last) && now()->getTimestamp() - $last > (int) config('zamaro.admin.idle_timeout_minutes') * 60;
    }
}
