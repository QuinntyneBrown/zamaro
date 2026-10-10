<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\AttemptSignIn;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\SignInRequest;
use App\Http\Resources\Accounts\CurrentUserResource;

class SessionController extends Controller
{
    /**
     * Sign in.
     *
     * Starts a session for Zamaro Web: the response sets a new `zamaro_session` cookie. A wrong
     * password and an unknown email both get 422 with `errors.credentials` (L2-023.2).
     */
    public function store(SignInRequest $request, AttemptSignIn $signIn): CurrentUserResource
    {
        $user = $signIn->handle($request->validated('email'), $request->validated('password'), $request);

        return new CurrentUserResource($user->load('roles'));
    }
}
