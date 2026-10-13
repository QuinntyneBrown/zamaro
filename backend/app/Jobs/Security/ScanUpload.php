<?php

namespace App\Jobs\Security;

use App\Actions\Security\PromoteUpload;
use App\Actions\Security\RejectInfectedUpload;
use App\Contracts\MediaScanner;
use App\Enums\ScanVerdict;
use App\Enums\UploadStatus;
use App\Jobs\Concerns\RetriesWithBackoff;
use App\Models\Upload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Scans one quarantined upload (L2-076.1–.2) on the `uploads` queue. Clean files are promoted,
 * malware is rejected, and a scanner error throws so the job retries with backoff while the file
 * stays in quarantine (L2-092.1). An upload already past quarantine is left alone.
 */
class ScanUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesWithBackoff;

    public function __construct(public readonly string $uploadId)
    {
        $this->onQueue('uploads');
    }

    public function handle(MediaScanner $scanner, PromoteUpload $promote, RejectInfectedUpload $reject): void
    {
        $upload = Upload::find($this->uploadId);
        if ($upload === null || $upload->status !== UploadStatus::Quarantined) {
            return;
        }
        $stream = Storage::disk(config('zamaro.uploads.disks.quarantine'))->readStream($upload->quarantine_key);
        if ($stream === null) {
            throw new RuntimeException("Upload {$upload->id} has no quarantined file.");
        }
        try {
            $result = $scanner->scan($stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        match ($result->verdict) {
            ScanVerdict::Clean => $promote->handle($upload),
            ScanVerdict::Infected => $reject->handle($upload, (string) $result->signature),
            ScanVerdict::Error => throw new RuntimeException("The scanner could not scan upload {$upload->id}."),
        };
    }
}
