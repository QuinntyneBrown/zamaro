<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\AttemptSignIn;
use App\Actions\Accounts\SignInPaused;
use App\Actions\Accounts\SignOut;
use App\Actions\Accounts\TwoFactorChallenge;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\SignInRequest;
use App\Http\Requests\Accounts\TwoFactorChallengeRequest;
use App\Http\Resources\Accounts\CurrentUserResource;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SessionController extends Controller
{
    /**
     * Sign in.
     *
     * Starts a session for Zamaro Web: the response sets a new `zamaro_session` cookie. A wrong
     * password and an unknown email both get 422 with `errors.credentials` (L2-023.2).
     *
     * @throws SignInPaused 429 `sign-in-paused` after 5 failures for the address in 15 minutes, with
     *                      `pausedUntil`; any address, with an account or not (L2-072.4)
     */
    public function store(SignInRequest $request, AttemptSignIn $signIn): CurrentUserResource|JsonResponse
    {
        $user = $signIn->handle($request->validated('email'), $request->validated('password'), $request);
        if ($user->mfa_enabled) {
            return self::codeNeeded($user);
        }

        return new CurrentUserResource($user->load('roles'));
    }

    /**
     * Complete sign-in with a code.
     *
     * After the password step answered 202, a current code from the authenticator app, or an unused
     * recovery code once, signs in with a new session (L2-072.3). Wrong codes count toward the
     * 5-in-15-minutes pause (L2-072.4).
     *
     * @throws AuthenticationException 401 when no password step is waiting or it is more than 10
     *                                 minutes old
     * @throws SignInPaused 429 `sign-in-paused` after 5 wrong passwords or codes in 15 minutes
     */
    public function twoFactor(TwoFactorChallengeRequest $request, TwoFactorChallenge $challenge): CurrentUserResource
    {
        $user = $challenge->complete($request->validated(), $request);

        return new CurrentUserResource($user->load('roles'));
    }

    /** The password was right; a code from the authenticator app comes next (202). */
    public static function codeNeeded(User $user): JsonResponse
    {
        return response()->json([
            'data' => [
                'twoFactorRequired' => true,
                /** The account being signed in to. */
                'email' => $user->email,
            ],
        ], 202);
    }

    /**
     * Sign out.
     *
     * Ends the session on the server: the cookie the browser held gets 401 afterwards, and the
     * response sets a new session and CSRF token (L2-023.5).
     */
    public function destroy(Request $request, SignOut $signOut): Response
    {
        $signOut->handle($request);

        return response()->noContent();
    }
}
