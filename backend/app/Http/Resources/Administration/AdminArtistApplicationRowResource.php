<?php

namespace App\Http\Resources\Administration;

use App\Models\ArtistApplication;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One row of the applications queue (pages/admin-applications): who, what, where and when. The email
 * and the references wait for the review screen.
 *
 * @property ArtistApplication $resource
 */
class AdminArtistApplicationRowResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $application = $this->resource;

        return [
            'id' => $application->id,
            /** "A-0219". */
            'number' => $application->number,
            /** @var 'submitted'|'approved'|'rejected' */
            'status' => $application->status->value,
            'name' => $application->name,
            /** @var 'solo'|'duo'|'band'|'choir' */
            'actType' => $application->act_type->value,
            /** The town only: "Scarborough". */
            'baseCity' => $application->base_city,
            /**
             * When it was sent, Toronto time.
             *
             * @var string
             */
            'submittedAt' => $application->submitted_at->setTimezone(config('app.timezone'))->toIso8601String(),
        ];
    }
}
