<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\LinkExpired;
use App\Actions\Accounts\ResetPassword;
use App\Actions\Accounts\SendPasswordResetLink;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\CheckPasswordResetRequest;
use App\Http\Requests\Accounts\ForgotPasswordRequest;
use App\Http\Requests\Accounts\ResetPasswordRequest;
use App\Http\Resources\Accounts\CurrentUserResource;
use Illuminate\Http\JsonResponse;

class PasswordResetController extends Controller
{
    /**
     * Ask for a reset link.
     *
     * Every valid request gets the same 202, whether or not the address has an account (L2-023.3); an
     * account is emailed a link that works once, for 60 minutes, and earlier links stop working.
     */
    public function forgot(ForgotPasswordRequest $request, SendPasswordResetLink $send): JsonResponse
    {
        $email = $send->handle($request->validated('email'));

        return response()->json([
            'data' => [
                /** The address typed, in lower case. */
                'email' => $email,
            ],
        ], 202);
    }

    /**
     * Check a reset link.
     *
     * Says whether the link still works, without using it.
     *
     * @throws LinkExpired 410 when the link was used, is more than 60 minutes old or is unknown; one
     *                     that existed names its account (`email`) and when it was sent (`sentAt`)
     */
    public function check(CheckPasswordResetRequest $request, ResetPassword $reset): JsonResponse
    {
        $token = $reset->check($request->validated('token'));

        return response()->json([
            'data' => [
                /** The account the link resets. */
                'email' => $token->user->email,
                /**
                 * When the link stops working.
                 *
                 * @var string
                 *
                 * @format date-time
                 */
                'expiresAt' => $token->expires_at->setTimezone(config('app.timezone'))->toIso8601String(),
            ],
        ]);
    }

    /**
     * Choose a new password.
     *
     * Uses the link once: the password changes, every session of the account ends, its owner is
     * emailed, and this browser is signed in with a new session (L2-023.4).
     *
     * @throws LinkExpired 410 when the link was used, is more than 60 minutes old or is unknown
     */
    public function reset(ResetPasswordRequest $request, ResetPassword $reset): CurrentUserResource|JsonResponse
    {
        $user = $reset->handle($request->validated('token'), $request->validated('password'), $request);
        if ($user->mfa_enabled) {
            // With two-step sign-in on, the code step signs this browser in (202).
            return SessionController::codeNeeded($user);
        }

        return new CurrentUserResource($user->load('roles'));
    }
}
