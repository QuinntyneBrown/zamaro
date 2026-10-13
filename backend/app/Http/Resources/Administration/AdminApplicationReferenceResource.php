<?php

namespace App\Http\Resources\Administration;

use App\Models\ApplicationReference;
use App\Rules\NorthAmericanPhone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A church reference as the administrator sees it (pages/admin-application): the decrypted contact, so
 * they can call or email, and who verified it when. Administrators only (L2-079.2).
 *
 * @property ApplicationReference $resource
 */
class AdminApplicationReferenceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $reference = $this->resource;

        return [
            'id' => $reference->id,
            /** "Pastor Samuel Osei". */
            'name' => $reference->name,
            /** "Cornerstone Baptist, Scarborough". */
            'church' => $reference->church,
            /**
             * The phone number as people write it ("647 555 0192") or the email address.
             *
             * @var string
             */
            'contact' => $reference->phone !== null ? str_replace('-', ' ', NorthAmericanPhone::format($reference->phone)) : (string) $reference->email,
            /**
             * When an administrator ticked it, Toronto time, or null.
             *
             * @var string|null
             */
            'verifiedAt' => $reference->verified_at?->setTimezone(config('app.timezone'))->toIso8601String(),
            /** The administrator who ticked it, or null. */
            'verifiedBy' => $reference->verifier === null ? null : ['name' => $reference->verifier->name],
        ];
    }
}
