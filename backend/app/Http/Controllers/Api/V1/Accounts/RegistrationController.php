<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\RegisterBooker;
use App\Actions\Privacy\LegalDocumentOutdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\RegisterBookerRequest;
use Illuminate\Http\JsonResponse;

class RegistrationController extends Controller
{
    /**
     * Register as a booker.
     *
     * Every valid submission gets the same 202, whether or not the address already has an account
     * (L2-022.2): a new account is sent a verification link; an existing owner is told by email. The
     * person is not signed in.
     *
     * @throws LegalDocumentOutdated 409 when the terms or privacy policy shown are no longer current
     */
    public function __invoke(RegisterBookerRequest $request, RegisterBooker $register): JsonResponse
    {
        $email = $register->handle($request->validated(), $request);

        return response()->json([
            'data' => [
                /** The address the link was sent to, in lower case. */
                'email' => $email,
            ],
        ], 202);
    }
}
