<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\EnableTwoFactor;
use App\Actions\Accounts\ManageTwoFactor;
use App\Actions\Accounts\SignInPaused;
use App\Actions\Accounts\TwoFactorAlreadyOn;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\TwoFactorCodeRequest;
use App\Http\Requests\Accounts\TwoFactorProofRequest;
use App\Services\Accounts\TotpVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/** Turning on two-step sign-in (L2-072.3, accounts/sign-in-and-recover-access). */
class TwoFactorController extends Controller
{
    /**
     * Begin two-step sign-in.
     *
     * Makes a new key for an authenticator app. Nothing changes until a code confirms it; a second call
     * replaces the key.
     *
     * @throws TwoFactorAlreadyOn 409 when two-step sign-in is already on
     */
    public function begin(Request $request, EnableTwoFactor $enable, TotpVerifier $totp): JsonResponse
    {
        $secret = $enable->begin($request->user());

        return response()->json([
            'data' => [
                /** The key to type into the app, in groups of four: "JBSW Y3DP …". */
                'key' => TotpVerifier::grouped($secret),
                /** What the QR code holds. */
                'otpauthUri' => $totp->uri($request->user(), $secret),
            ],
        ]);
    }

    /**
     * The QR code of the key begun.
     *
     * An SVG image, for the setup page's `<img>`; 404 when no key is waiting.
     */
    public function qr(Request $request, TotpVerifier $totp): Response
    {
        $user = $request->user();
        abort_if($user->mfa_enabled || $user->two_factor_secret === null, 404);

        return response($totp->qrSvg($totp->uri($user, $user->two_factor_secret)), 200, ['Content-Type' => 'image/svg+xml']);
    }

    /**
     * Turn off two-step sign-in.
     *
     * Needs a current code or an unused recovery code; the key and every recovery code go, and the
     * owner is emailed (L2-072.5). 404 when it is not on.
     *
     * @throws SignInPaused 429 `sign-in-paused` after 5 wrong codes or passwords in 15 minutes
     */
    public function destroy(TwoFactorProofRequest $request, ManageTwoFactor $manage): Response
    {
        abort_unless($request->user()->mfa_enabled, 404);
        $manage->turnOff($request->user(), $request->validated('code'));

        return response()->noContent();
    }

    /**
     * New recovery codes.
     *
     * Needs a current code or an unused recovery code; 10 new codes replace every earlier one and are
     * answered once (L2-072.5). 404 when two-step sign-in is not on.
     *
     * @throws SignInPaused 429 `sign-in-paused` after 5 wrong codes or passwords in 15 minutes
     */
    public function recoveryCodes(TwoFactorProofRequest $request, ManageTwoFactor $manage): JsonResponse
    {
        abort_unless($request->user()->mfa_enabled, 404);

        return response()->json([
            'data' => [
                /** @var list<string> */
                'recoveryCodes' => $manage->newRecoveryCodes($request->user(), $request->validated('code')),
            ],
        ]);
    }

    /**
     * Turn on two-step sign-in.
     *
     * The first code from the app turns it on; the answer holds the 10 recovery codes, shown only
     * this once. The owner is emailed.
     *
     * @throws TwoFactorAlreadyOn 409 when two-step sign-in is already on
     */
    public function confirm(TwoFactorCodeRequest $request, EnableTwoFactor $enable): JsonResponse
    {
        $codes = $enable->confirm($request->user(), $request->validated('code'));

        return response()->json([
            'data' => [
                /** @var list<string> */
                'recoveryCodes' => $codes,
            ],
        ]);
    }
}
