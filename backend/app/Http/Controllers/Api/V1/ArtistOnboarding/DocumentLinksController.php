<?php

namespace App\Http\Controllers\Api\V1\ArtistOnboarding;

use App\Actions\Audit\RecordAuditEntry;
use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use App\Http\Controllers\Controller;
use App\Models\VulnerableSectorCheck;
use App\Support\PrivateDocumentUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/** A signed link to a check's document (verify-vulnerable-sector-check, L2-049.4). */
class DocumentLinksController extends Controller
{
    /**
     * A link to the check's document.
     *
     * For the check's owner and administrators: a URL on the media host that works for 5 minutes and
     * streams the document as a download. Anyone else, and a check with no document yet, gets 404.
     * An administrator opening a document is recorded in the audit log (L2-069).
     */
    public function show(Request $request, VulnerableSectorCheck $check, RecordAuditEntry $audit): JsonResponse
    {
        Gate::authorize('view', $check);
        abort_if($check->storage_key === null, 404);

        if ($check->user_id !== $request->user()->id) {
            $audit->handle($request->user(), AuditAction::VscDocumentViewed, $check, AuditOutcome::Succeeded);
        }
        $link = PrivateDocumentUrl::for($check);

        return response()->json([
            'data' => [
                /** The signed link, on the media host. */
                'url' => $link['url'],
                /**
                 * When the link stops working, 5 minutes from now.
                 *
                 * @var string
                 */
                'expiresAt' => $link['expiresAt'],
            ],
        ]);
    }
}
