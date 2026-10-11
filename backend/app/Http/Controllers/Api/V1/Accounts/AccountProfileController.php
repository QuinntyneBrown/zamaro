<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Accounts\UpdateProfileRequest;
use App\Http\Resources\Accounts\CurrentUserResource;
use Illuminate\Support\Str;

class AccountProfileController extends Controller
{
    /**
     * Change the account name.
     *
     * The header's initials follow it (L2-024.2).
     */
    public function update(UpdateProfileRequest $request): CurrentUserResource
    {
        $user = $request->user();
        $user->update(['name' => Str::squish($request->validated('name'))]);

        return new CurrentUserResource($user->load('roles'));
    }
}
