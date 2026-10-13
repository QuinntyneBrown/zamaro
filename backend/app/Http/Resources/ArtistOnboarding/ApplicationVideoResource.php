<?php

namespace App\Http\Resources\ArtistOnboarding;

use App\Models\ArtistVideo;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An applicant's video as the upload row shows it (apply-as-artist, L2-052.2): how far it is, then
 * Processing, then Live with its length and poster, or why it failed.
 *
 * @property ArtistVideo $resource
 */
class ApplicationVideoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $video = $this->resource;

        return [
            /**
             * The upload's token: the address of its chunks, its offset and its status, and what the application names.
             *
             * @var string
             */
            'token' => $video->upload_token,
            /** @var 'uploading'|'processing'|'live'|'failed' */
            'status' => $video->status->value,
            'title' => $video->title,
            /** @var string */
            'fileName' => $video->file_name,
            /**
             * The whole file, in bytes.
             *
             * @var int
             */
            'size' => $video->size_bytes,
            /**
             * How many bytes have arrived; the next chunk starts here.
             *
             * @var int
             */
            'offset' => $video->uploaded_bytes,
            /** Once Live: the length in seconds ("5:48"). */
            'durationSeconds' => $video->duration_seconds,
            /** Once Live: the poster frame. */
            'posterUrl' => $video->poster_key === null ? null : Media::url($video->poster_key),
            /**
             * Once failed: what the applicant reads.
             *
             * @var string|null
             */
            'failureReason' => $video->failure_reason,
        ];
    }
}
