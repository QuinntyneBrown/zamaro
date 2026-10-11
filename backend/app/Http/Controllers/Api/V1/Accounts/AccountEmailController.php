<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\ConfirmEmailChange;
use App\Actions\Accounts\LinkExpired;
use App\Actions\Accounts\RequestEmailChange;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\ChangeEmailRequest;
use App\Http\Requests\Accounts\ConfirmEmailChangeRequest;
use Illuminate\Http\JsonResponse;

/** Changing the account email (L2-025.1, accounts/manage-account-settings). */
class AccountEmailController extends Controller
{
    /**
     * Ask for a new email.
     *
     * Confirmed with the current password. The new address gets a link that works once, for 24 hours,
     * and the current one a notice; the account email stays until the link is opened. An address
     * another account uses gets the same answer and no link.
     */
    public function update(ChangeEmailRequest $request, RequestEmailChange $change): JsonResponse
    {
        $email = $change->handle($request->user(), $request->validated('email'));

        return response()->json([
            'data' => [
                /** The new address, in lower case. */
                'email' => $email,
            ],
        ], 202);
    }

    /**
     * Open an email change link.
     *
     * The account moves to the new address, verified. Anyone holding the link may open it; it signs
     * no one in.
     *
     * @throws LinkExpired 410 when the link was used, is more than 24 hours old, is unknown, or its
     *                     address was taken meanwhile; one that existed names the address the account
     *                     still signs in with (`email`)
     */
    public function confirm(ConfirmEmailChangeRequest $request, ConfirmEmailChange $confirm): JsonResponse
    {
        $user = $confirm->handle($request->validated('token'));

        return response()->json([
            'data' => [
                /** The address the account now signs in with. */
                'email' => $user->email,
            ],
        ]);
    }
}
