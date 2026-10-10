<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Resources\Accounts\CurrentUserResource;
use Illuminate\Http\Request;

class MeController extends Controller
{
    /**
     * The signed-in person.
     *
     * A guest gets 401.
     */
    public function show(Request $request): CurrentUserResource
    {
        return new CurrentUserResource($request->user()->load('roles'));
    }
}
