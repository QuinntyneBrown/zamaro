<?php

namespace App\Actions\Security;

use App\Enums\UploadPurpose;
use App\Enums\UploadStatus;
use App\Enums\VscStatus;
use App\Jobs\ArtistOnboarding\ProcessApplicationVideo;
use App\Models\ArtistVideo;
use App\Models\Upload;
use App\Models\VulnerableSectorCheck;
use App\Services\ArtistOnboarding\DocumentVault;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * A clean upload leaves quarantine (L2-076.3): a Vulnerable Sector Check is encrypted into the
 * private documents disk through DocumentVault and its check waits for verification (L2-049.1);
 * other files move to the originals disk under a random name for their processing jobs: an
 * application video to ProcessApplicationVideo, the rest in M4. The quarantine copy is deleted.
 */
class PromoteUpload
{
    public function __construct(private readonly DocumentVault $vault) {}

    public function handle(Upload $upload): void
    {
        $quarantine = Storage::disk(config('zamaro.uploads.disks.quarantine'));
        $contents = (string) $quarantine->get($upload->quarantine_key);

        DB::transaction(function () use ($upload, $contents) {
            if ($upload->purpose === UploadPurpose::VscDocument) {
                $stored = $this->vault->store($contents);
                VulnerableSectorCheck::where('upload_id', $upload->id)->update([
                    'status' => VscStatus::Pending->value,
                    'storage_key' => $stored['key'],
                    'wrapped_data_key' => $stored['wrappedDataKey'],
                    'mime_type' => $upload->detected_mime,
                    'size_bytes' => $upload->size_bytes,
                    'updated_at' => now(),
                ]);
                $objectKey = $stored['key'];
            } else {
                $objectKey = bin2hex(random_bytes(16));
                Storage::disk(config('zamaro.uploads.disks.originals'))->put($objectKey, $contents);
            }
            $upload->forceFill(['status' => UploadStatus::Clean, 'object_key' => $objectKey, 'scanned_at' => now()])->save();
            // An application video goes on to the transcoder (apply-as-artist, L2-052.1).
            if ($upload->purpose === UploadPurpose::Video && ArtistVideo::where('upload_id', $upload->id)->exists()) {
                ProcessApplicationVideo::dispatch($upload->id)->afterCommit();
            }
        });

        $quarantine->delete($upload->quarantine_key);
    }
}
