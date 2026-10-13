<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Http\Controllers\Controller;
use App\Http\Resources\Accounts\SessionResource;
use App\Services\Accounts\SessionRegistry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/** The signed-in devices (L2-025.3, accounts/manage-account-settings). */
class AccountSessionController extends Controller
{
    /**
     * The signed-in devices.
     *
     * Every session still within its idle lifetime: this browser's first, then the most recently
     * active.
     */
    public function index(Request $request, SessionRegistry $registry): AnonymousResourceCollection
    {
        return SessionResource::collection($registry->active($request->user(), $request));
    }

    /**
     * End a session.
     *
     * Signs that device out at once: its next request gets 401. A session that is not the caller's
     * gets the same 404 as one that does not exist (L2-074.2).
     */
    public function destroy(Request $request, SessionRegistry $registry, string $session): Response
    {
        abort_unless($registry->end($request->user(), $session), 404);

        return response()->noContent();
    }
}
