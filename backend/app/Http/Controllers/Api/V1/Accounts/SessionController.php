<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\AttemptSignIn;
use App\Actions\Accounts\SignInPaused;
use App\Actions\Accounts\SignOut;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\SignInRequest;
use App\Http\Resources\Accounts\CurrentUserResource;
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
    public function store(SignInRequest $request, AttemptSignIn $signIn): CurrentUserResource
    {
        $user = $signIn->handle($request->validated('email'), $request->validated('password'), $request);

        return new CurrentUserResource($user->load('roles'));
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
