<?php

namespace App\Actions\ArtistOnboarding;

use App\Enums\UploadPurpose;
use App\Enums\UploadStatus;
use App\Enums\VideoStatus;
use App\Jobs\Security\ScanUpload;
use App\Models\ArtistVideo;
use App\Models\Upload;
use App\Services\Security\ContentTypeDetector;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * The last chunk is in (ADR-0026): the parts become one quarantined file under a random name, typed
 * from its first bytes as every upload is (L2-076.1), and the scan is queued; the video is
 * Processing until the pipeline and the transcoder are done. A file that is not a video (or is
 * markup) fails here, with the reason the applicant reads, and leaves nothing behind.
 */
class CompleteApplicationVideoUpload
{
    public function __construct(private readonly ContentTypeDetector $detector) {}

    public function handle(ArtistVideo $video): void
    {
        $quarantine = Storage::disk(config('zamaro.uploads.disks.quarantine'));
        $parts = collect($quarantine->files(AppendApplicationVideoChunk::PART_PREFIX.'/'.$video->upload_token))->sort()->values();

        $assembled = fopen('php://temp/maxmemory:'.(8 * 1024 * 1024), 'w+b');
        foreach ($parts as $part) {
            $stream = $quarantine->readStream($part);
            if (is_resource($stream)) {
                stream_copy_to_stream($stream, $assembled);
                fclose($stream);
            }
        }
        rewind($assembled);
        $mime = $this->detector->detectBytes((string) fread($assembled, 4096));
        rewind($assembled);

        if ($mime === null || ! in_array($mime, UploadPurpose::Video->allowedTypes(), true)) {
            fclose($assembled);
            $this->deleteParts($quarantine, $parts->all());
            $video->forceFill(['status' => VideoStatus::Failed, 'failure_reason' => UploadPurpose::Video->wrongTypeMessage()])->save();

            return;
        }

        $key = (string) Str::uuid();
        $quarantine->writeStream($key, $assembled);
        if (is_resource($assembled)) {
            fclose($assembled);
        }
        $this->deleteParts($quarantine, $parts->all());

        DB::transaction(function () use ($video, $mime, $key) {
            $upload = Upload::create([
                'user_id' => null,
                'purpose' => UploadPurpose::Video,
                'detected_mime' => $mime,
                'size_bytes' => $video->size_bytes,
                'quarantine_key' => $key,
                'status' => UploadStatus::Quarantined,
            ]);
            $video->forceFill(['status' => VideoStatus::Processing, 'upload_id' => $upload->id])->save();
            ScanUpload::dispatch($upload->id)->afterCommit();
        });
    }

    /** @param  list<string>  $parts */
    private function deleteParts(Filesystem $quarantine, array $parts): void
    {
        foreach ($parts as $part) {
            $quarantine->delete($part);
        }
    }
}
