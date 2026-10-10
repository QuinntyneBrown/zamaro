<?php

namespace App\Http\Resources\Privacy;

use App\Models\LegalDocument;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One version of a legal document, as the sign-up form and the updated-terms page show it.
 *
 * @property LegalDocument $resource
 */
class LegalDocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            /** The year and month it takes effect: "2026-10". */
            'version' => $this->resource->version,
            /** @format date */
            'effectiveFrom' => $this->resource->effective_from->toDateString(),
            'url' => $this->resource->url,
            /** @var list<string> */
            'summaryOfChanges' => $this->resource->summary_of_changes,
        ];
    }
}
