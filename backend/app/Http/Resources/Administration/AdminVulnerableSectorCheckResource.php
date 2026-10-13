<?php

namespace App\Http\Resources\Administration;

use App\Enums\VscStatus;
use App\Models\VulnerableSectorCheck;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A check in the admin queue (pages/admin-checks): whose, when issued and uploaded, what it replaces,
 * and its decision. Never the document itself.
 *
 * @property VulnerableSectorCheck $resource
 */
class AdminVulnerableSectorCheckResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $check = $this->resource;
        $artist = $check->user->artist;
        $replaces = VulnerableSectorCheck::where('user_id', $check->user_id)
            ->where('status', VscStatus::Verified)
            ->whereKeyNot($check->id)
            ->orderByDesc('expires_on')
            ->first();

        return [
            'id' => $check->id,
            'artist' => [
                'id' => $artist?->id,
                /** "Elijah Park"; the account's name when the person has no artist profile yet. */
                'name' => $artist?->display_name ?? $check->user->name,
                'slug' => $artist?->slug,
            ],
            /** @var 'scanning'|'pending'|'verified'|'blocked' */
            'status' => $check->status->value,
            /** `YYYY-MM-DD`, as printed on the check. */
            'issuedOn' => $check->issued_on->toDateString(),
            /**
             * When it was uploaded, Toronto time.
             *
             * @var string
             */
            'uploadedAt' => $check->created_at->setTimezone(config('app.timezone'))->toIso8601String(),
            /** `YYYY-MM-DD` once verified, or null. */
            'expiresOn' => $check->expires_on?->toDateString(),
            /**
             * When it was verified, or null.
             *
             * @var string|null
             */
            'verifiedAt' => $check->verified_at?->setTimezone(config('app.timezone'))->toIso8601String(),
            /** The administrator who verified it, or null. */
            'verifiedBy' => $check->verifier === null ? null : ['name' => $check->verifier->name],
            /** The artist's verified check this one replaces, or null for a first check. */
            'replaces' => $replaces === null ? null : [
                /** `YYYY-MM-DD`: "Replaces the check verified until Fri 3 Mar 2028". */
                'verifiedUntil' => $replaces->expires_on->toDateString(),
            ],
        ];
    }
}
