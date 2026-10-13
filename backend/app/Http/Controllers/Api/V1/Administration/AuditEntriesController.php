<?php

namespace App\Http\Controllers\Api\V1\Administration;

use App\Actions\Administration\ListAuditEntries;
use App\Http\Controllers\Controller;
use App\Http\Requests\Administration\ListAuditEntriesRequest;
use App\Http\Resources\Administration\AuditEntryResource;
use App\Models\AuditEntry;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** The read-only audit log (administration/record-audit-log, L2-069). There is no write here, by design. */
class AuditEntriesController extends Controller
{
    /**
     * The audit log, newest first.
     *
     * 50 entries at a time, narrowed by actor email, action, target, outcome and a date range.
     * Administrators only; everyone else gets 404 (L2-066.1).
     */
    public function index(ListAuditEntriesRequest $request, ListAuditEntries $entries): AnonymousResourceCollection
    {
        $page = $entries->handle($request->validated(), $request->cursor());

        return AuditEntryResource::collection($page->items())->additional([
            'meta' => [
                'perPage' => ListAuditEntries::PER_PAGE,
                /** Pass as `cursor` for the older entries; null on the last page. */
                'nextCursor' => $page->nextCursor()?->encode(),
            ],
        ]);
    }

    /**
     * One audit entry.
     *
     * The same row as the log lists. Entries can only be read: `PATCH`, `PUT` and `DELETE` on this
     * address answer 405 (L2-069.2).
     */
    public function show(AuditEntry $entry): AuditEntryResource
    {
        return new AuditEntryResource($entry->load(['actor', 'target']));
    }
}
