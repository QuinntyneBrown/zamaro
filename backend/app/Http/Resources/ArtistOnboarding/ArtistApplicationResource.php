<?php

namespace App\Http\Resources\ArtistOnboarding;

use App\Models\ApplicationReference;
use App\Models\ArtistApplication;
use App\Models\ArtistVideo;
use App\Services\ArtistOnboarding\BusinessDayCalendar;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The application as its applicant sees it (apply-as-artist): the number, the status, when it was
 * sent and the reply-by date. References are named, never their phone or email (L2-079).
 *
 * @property ArtistApplication $resource
 */
class ArtistApplicationResource extends JsonResource
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
            'email' => $application->email,
            /**
             * When it was sent, Toronto time.
             *
             * @var string
             */
            'submittedAt' => $application->submitted_at->setTimezone(config('app.timezone'))->toIso8601String(),
            /**
             * `YYYY-MM-DD`: 3 business days after it was sent (L2-047.4).
             *
             * @var string
             */
            'replyBy' => app(BusinessDayCalendar::class)->businessDaysAfter($application->submitted_at, 3)->toDateString(),
            /** The videos, in order. */
            'videos' => $application->videos->map(fn (ArtistVideo $video) => [
                /** @var string */
                'token' => $video->upload_token,
                'title' => $video->title,
                /** @var 'uploading'|'processing'|'live'|'failed' */
                'status' => $video->status->value,
            ])->all(),
            /** The two references by name and church only. */
            'references' => $application->references->map(fn (ApplicationReference $reference) => [
                'name' => $reference->name,
                'church' => $reference->church,
            ])->all(),
        ];
    }
}
