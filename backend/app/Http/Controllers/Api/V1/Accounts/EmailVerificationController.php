<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\LinkExpired;
use App\Actions\Accounts\ResendVerificationEmail;
use App\Actions\Accounts\VerifyEmail;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\ResendVerificationEmailRequest;
use App\Http\Requests\Accounts\VerifyEmailRequest;
use Illuminate\Http\JsonResponse;

class EmailVerificationController extends Controller
{
    /**
     * Verify an email address.
     *
     * The emailed link's token marks the address verified, once, within 24 hours (L2-022.3). The
     * person is not signed in.
     *
     * @throws LinkExpired 410 when the link was used, is more than 24 hours old or is unknown
     */
    public function verify(VerifyEmailRequest $request, VerifyEmail $verify): JsonResponse
    {
        $user = $verify->handle($request->validated('token'));

        return response()->json([
            'data' => [
                /** The person whose address is now verified, for the page's thanks. */
                'name' => $user->name,
            ],
        ]);
    }

    /**
     * Send a new verification link.
     *
     * To the signed-in booker, else the owner of `token`, else `email`. Earlier links stop working.
     * The answer is the same whether or not anything was sent (L2-022.2).
     */
    public function resend(ResendVerificationEmailRequest $request, ResendVerificationEmail $resend): JsonResponse
    {
        $resend->handle($request->user(), $request->validated('token'), $request->validated('email'), $request->validated('returnUrl'));

        return response()->json([
            'data' => [
                /** Always true: the request was taken, whether or not an email was due. */
                'accepted' => true,
            ],
        ], 202);
    }
}
