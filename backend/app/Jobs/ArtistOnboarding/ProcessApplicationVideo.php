<?php

namespace App\Jobs\ArtistOnboarding;

use App\Contracts\VideoTranscoder;
use App\Enums\VideoStatus;
use App\Jobs\Concerns\RetriesWithBackoff;
use App\Models\ArtistVideo;
use App\Models\Upload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * A clean application video leaves the originals disk for the transcoder (L2-052.1): longer than 15
 * minutes it fails with its reason and the original is deleted; otherwise it comes back as a stream
 * manifest and a poster on the media disk and goes Live. Runs after ScanUpload on the `uploads`
 * queue; a video already past Processing is left alone, so a retry is harmless (L2-092).
 */
class ProcessApplicationVideo implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesWithBackoff;

    public const MAX_SECONDS = 15 * 60;

    public function __construct(public readonly string $uploadId)
    {
        $this->onQueue('uploads');
    }

    public function handle(VideoTranscoder $transcoder): void
    {
        $upload = Upload::find($this->uploadId);
        $video = $upload === null ? null : ArtistVideo::where('upload_id', $upload->id)->first();
        if ($upload === null || $upload->object_key === null || $video === null || $video->status !== VideoStatus::Processing) {
            return;
        }
        $originals = Storage::disk(config('zamaro.uploads.disks.originals'));
        $stream = $originals->readStream($upload->object_key);
        if ($stream === null) {
            throw new RuntimeException("Upload {$upload->id} has no original file.");
        }
        try {
            $seconds = $transcoder->probe($stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        if ($seconds > self::MAX_SECONDS) {
            $originals->delete($upload->object_key);
            $minutes = (int) ceil($seconds / 60);
            $video->forceFill([
                'status' => VideoStatus::Failed,
                'original_key' => null,
                'failure_reason' => "This video is {$minutes} minutes long. Videos can be up to 15 minutes.",
            ])->save();

            return;
        }

        $result = $transcoder->transcode($upload->object_key, "applications/videos/{$video->id}");
        $video->forceFill([
            'status' => VideoStatus::Live,
            'original_key' => $upload->object_key,
            'manifest_key' => $result->manifestKey,
            'poster_key' => $result->posterKey,
            'duration_seconds' => $result->durationSeconds,
        ])->save();
    }
}
