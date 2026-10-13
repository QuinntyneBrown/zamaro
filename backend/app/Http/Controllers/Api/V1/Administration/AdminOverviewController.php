<?php

namespace App\Http\Controllers\Api\V1\Administration;

use App\Enums\VscStatus;
use App\Http\Controllers\Controller;
use App\Models\VulnerableSectorCheck;
use Illuminate\Http\JsonResponse;

/** The counts the admin shell shows beside its sections (administration/secure-admin-access, M3 D17). */
class AdminOverviewController extends Controller
{
    /**
     * The admin overview.
     *
     * What is waiting for the Zamaro team. Only an administrator who signed in with a code gets it;
     * everyone else gets 404, as on every admin route (L2-066.1). Calling it counts as activity, so the
     * admin app's "Stay signed in" uses it (L2-066.3).
     */
    public function show(): JsonResponse
    {
        return response()->json([
            'data' => [
                /** Vulnerable Sector Checks uploaded and not yet verified (L2-049.2). */
                'checksWaiting' => VulnerableSectorCheck::where('status', VscStatus::Pending)->count(),
            ],
        ]);
    }
}
