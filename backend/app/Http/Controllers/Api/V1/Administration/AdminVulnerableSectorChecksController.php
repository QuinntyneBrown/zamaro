<?php

namespace App\Http\Controllers\Api\V1\Administration;

use App\Actions\ArtistOnboarding\VerifyVulnerableSectorCheck;
use App\Actions\ArtistOnboarding\VscAlreadyDecided;
use App\Enums\VscStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Administration\AdminVulnerableSectorCheckResource;
use App\Models\VulnerableSectorCheck;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** The administrator's Vulnerable Sector Check queue (verify-vulnerable-sector-check, L2-049.2). */
class AdminVulnerableSectorChecksController extends Controller
{
    /**
     * The checks waiting for verification.
     *
     * Oldest upload first, with the artist, the issue date and the verified check each one replaces.
     */
    public function index(): AnonymousResourceCollection
    {
        $waiting = VulnerableSectorCheck::where('status', VscStatus::Pending)
            ->with(['user.artist', 'verifier'])
            ->orderBy('created_at')->orderBy('id')
            ->get();

        return AdminVulnerableSectorCheckResource::collection($waiting)->additional([
            'meta' => [
                /** How many are waiting. */
                'waiting' => $waiting->count(),
            ],
        ]);
    }

    /**
     * Verify a check.
     *
     * It counts for Youth event searches for 3 years from its issue date (L2-049.2) and the decision is
     * audited (L2-069.1). A check issued more than 3 years ago is refused on `issuedOn`.
     *
     * @throws VscAlreadyDecided 409 `vsc-already-decided` when the check is no longer waiting
     */
    public function verify(Request $request, VulnerableSectorCheck $check, VerifyVulnerableSectorCheck $verify): AdminVulnerableSectorCheckResource
    {
        return new AdminVulnerableSectorCheckResource($verify->handle($check, $request->user())->load(['user.artist', 'verifier']));
    }
}
