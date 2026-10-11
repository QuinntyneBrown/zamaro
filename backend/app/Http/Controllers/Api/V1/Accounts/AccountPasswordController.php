<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Actions\Accounts\ChangePassword;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\ChangePasswordRequest;
use Illuminate\Http\Response;

class AccountPasswordController extends Controller
{
    /**
     * Change the password.
     *
     * Needs the current password. Every other session ends, and this one continues with a new session
     * ID and CSRF token (L2-025.2); the owner is emailed.
     */
    public function update(ChangePasswordRequest $request, ChangePassword $change): Response
    {
        $change->handle($request->user(), $request->validated('password'), $request);

        return response()->noContent();
    }
}
