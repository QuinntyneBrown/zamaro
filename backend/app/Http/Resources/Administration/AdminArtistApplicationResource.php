<?php

namespace App\Http\Resources\Administration;

use App\Models\ArtistApplication;
use App\Models\ArtistVideo;
use App\Models\VulnerableSectorCheck;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An application as the administrator reviews it (pages/admin-application, review-artist-application):
 * every applicant detail, the videos, the references with their decrypted contacts, the applicant's
 * latest Vulnerable Sector Check and the decision. Served `private, no-store` (L2-089.3).
 *
 * @property ArtistApplication $resource
 */
class AdminArtistApplicationResource extends JsonResource
{
    private const POSTER_WIDTH = 800;

    private const POSTER_HEIGHT = 450;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $application = $this->resource;
        $check = $application->user_id === null ? null : VulnerableSectorCheck::where('user_id', $application->user_id)->latest('id')->first();

        return [
            'id' => $application->id,
            /** "A-0219". */
            'number' => $application->number,
            /** @var 'submitted'|'approved'|'rejected' */
            'status' => $application->status->value,
            'name' => $application->name,
            'email' => $application->email,
            /** @var 'solo'|'duo'|'band'|'choir' */
            'actType' => $application->act_type->value,
            /** The town only: "Scarborough". */
            'baseCity' => $application->base_city,
            /** @var list<string> */
            'styles' => array_values($application->styles ?? []),
            /** Plain text; never render it as HTML. */
            'bio' => $application->bio,
            'fromPriceCents' => $application->from_price_cents,
            'maxDriveKm' => $application->max_drive_km,
            /**
             * When it was sent, Toronto time.
             *
             * @var string
             */
            'submittedAt' => $application->submitted_at->setTimezone(config('app.timezone'))->toIso8601String(),
            'videos' => $application->videos->map(fn (ArtistVideo $video) => [
                'id' => $video->id,
                'title' => $video->title,
                /** @var 'uploading'|'processing'|'live'|'failed' */
                'status' => $video->status->value,
                'durationSeconds' => (int) $video->duration_seconds,
                /** The poster frame, or null to keep the halftone placeholder. */
                'poster' => $video->poster_key === null ? null : [
                    'src' => Media::url($video->poster_key),
                    'width' => self::POSTER_WIDTH,
                    'height' => self::POSTER_HEIGHT,
                ],
                /** The HLS manifest once live, or null. */
                'stream' => $video->manifest_key === null ? null : Media::url($video->manifest_key),
            ])->values()->all(),
            'references' => AdminApplicationReferenceResource::collection($application->references)->resolve($request),
            /** The applicant's latest check, or null when they have uploaded none (an applicant without an account has none). */
            'vulnerableSectorCheck' => $check === null ? null : [
                'id' => $check->id,
                /** @var 'scanning'|'pending'|'verified'|'blocked' */
                'status' => $check->status->value,
                /** `YYYY-MM-DD`. */
                'issuedOn' => $check->issued_on->toDateString(),
                /** `YYYY-MM-DD` once verified, or null. */
                'expiresOn' => $check->expires_on?->toDateString(),
            ],
            /** Null while Submitted. */
            'decision' => $application->decided_at === null ? null : [
                /**
                 * Toronto time.
                 *
                 * @var string
                 */
                'decidedAt' => $application->decided_at->setTimezone(config('app.timezone'))->toIso8601String(),
                'decidedBy' => $application->decider === null ? null : ['name' => $application->decider->name],
                /** @var 'references-unconfirmed'|'videos-not-worship'|'outside-service-area'|'incomplete-or-inaccurate'|'other'|null */
                'rejectionReason' => $application->rejection_reason,
                /**
                 * The note sent with a rejection, or null.
                 *
                 * @var string|null
                 */
                'rejectionNote' => $application->rejection_note,
            ],
            /** The artist an approval created, hidden until payout setup; null otherwise. */
            'artist' => $application->artist === null ? null : [
                'id' => $application->artist->id,
                /** "tobi-adeyemi": the profile's address once published. */
                'slug' => $application->artist->slug,
                /** "ACT-0027". */
                'ticketNumber' => $application->artist->ticket_number,
                'payoutReady' => (bool) $application->artist->payout_ready,
            ],
        ];
    }
}
