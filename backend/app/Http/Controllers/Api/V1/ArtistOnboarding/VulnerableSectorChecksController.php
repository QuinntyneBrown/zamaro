<?php

namespace App\Http\Controllers\Api\V1\ArtistOnboarding;

use App\Actions\ArtistOnboarding\UploadVulnerableSectorCheck;
use App\Enums\VscStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ArtistOnboarding\UploadVulnerableSectorCheckRequest;
use App\Http\Resources\ArtistOnboarding\VulnerableSectorCheckResource;
use App\Models\VulnerableSectorCheck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** An artist's own Vulnerable Sector Checks (verify-vulnerable-sector-check, L2-049). Artists only. */
class VulnerableSectorChecksController extends Controller
{
    /**
     * Upload a check.
     *
     * `multipart/form-data`: the scan (PDF, JPEG or PNG up to 10 MB, typed by its content, never by its
     * name) and the issue date. Answers 202: the check is `scanning` until the malware scan passes,
     * then `pending` for an administrator (L2-049.1, L2-076.1). SVG and HTML are refused on `file`.
     */
    public function store(UploadVulnerableSectorCheckRequest $request, UploadVulnerableSectorCheck $upload): JsonResponse
    {
        $check = $upload->handle($request->user(), $request->file('file'), $request->issuedOn());

        return (new VulnerableSectorCheckResource($check))->response()->setStatusCode(202);
    }

    /**
     * Where the artist's checks stand.
     *
     * The most recent verified check, which is what Youth event searches count, and the newest check
     * of any status, which may be one still being scanned, waiting or blocked. Either is null when
     * there is none.
     */
    public function current(Request $request): JsonResponse
    {
        $checks = VulnerableSectorCheck::where('user_id', $request->user()->id)->orderByDesc('created_at')->orderByDesc('id')->get();
        $verified = $checks->first(fn (VulnerableSectorCheck $check) => $check->status === VscStatus::Verified);
        $latest = $checks->first();

        return response()->json([
            'data' => [
                /** The most recent verified check, which Youth event searches count, or null. */
                'verified' => $verified === null ? null : new VulnerableSectorCheckResource($verified),
                /** The newest check of any status, or null. */
                'latest' => $latest === null ? null : new VulnerableSectorCheckResource($latest),
            ],
        ]);
    }
}
