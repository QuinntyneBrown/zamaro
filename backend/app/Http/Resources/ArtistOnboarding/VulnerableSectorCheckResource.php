<?php

namespace App\Http\Resources\ArtistOnboarding;

use App\Models\VulnerableSectorCheck;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One check as its owner (and the admin queue) sees it: where it stands and its dates. Never the
 * document, its key or its name (L2-049.4).
 *
 * @property VulnerableSectorCheck $resource
 */
class VulnerableSectorCheckResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $check = $this->resource;

        return [
            'id' => $check->id,
            /** @var 'scanning'|'pending'|'verified'|'blocked' */
            'status' => $check->status->value,
            /** `YYYY-MM-DD`, as printed on the check. */
            'issuedOn' => $check->issued_on->toDateString(),
            /** `YYYY-MM-DD`, three years after the issue date once verified; null before. */
            'expiresOn' => $check->expires_on?->toDateString(),
            /**
             * When it was uploaded, Toronto time.
             *
             * @var string
             */
            'uploadedAt' => $check->created_at->setTimezone(config('app.timezone'))->toIso8601String(),
            /**
             * When an administrator verified it, or null.
             *
             * @var string|null
             */
            'verifiedAt' => $check->verified_at?->setTimezone(config('app.timezone'))->toIso8601String(),
        ];
    }
}
