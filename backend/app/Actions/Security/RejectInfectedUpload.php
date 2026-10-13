<?php

namespace App\Actions\Security;

use App\Enums\UploadStatus;
use App\Enums\VideoStatus;
use App\Enums\VscStatus;
use App\Models\ArtistVideo;
use App\Models\Upload;
use App\Models\VulnerableSectorCheck;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * A file the scanner flagged (L2-076.2): the quarantine copy is deleted, the upload is rejected as
 * malware with the signature, the check it carried is blocked or the video it was fails with its
 * reason, and a security event is recorded. An artist's earlier verified check is untouched.
 */
class RejectInfectedUpload
{
    /** What the applicant reads on the video's row (L2-052.2). */
    public const VIDEO_REASON = 'This file failed our malware scan and was deleted. Choose another video.';

    public function __construct(private readonly RecordSecurityEvent $security) {}

    public function handle(Upload $upload, string $signature): void
    {
        Storage::disk(config('zamaro.uploads.disks.quarantine'))->delete($upload->quarantine_key);

        DB::transaction(function () use ($upload, $signature) {
            $upload->forceFill([
                'status' => UploadStatus::Rejected,
                'rejection_reason' => 'malware',
                'scanner_signature' => $signature,
                'scanned_at' => now(),
            ])->save();
            VulnerableSectorCheck::where('upload_id', $upload->id)->update(['status' => VscStatus::Blocked->value, 'updated_at' => now()]);
            ArtistVideo::where('upload_id', $upload->id)->update([
                'status' => VideoStatus::Failed->value,
                'failure_reason' => self::VIDEO_REASON,
                'updated_at' => now(),
            ]);
        });

        $this->security->handle('upload.rejected_malware', [
            'upload_id' => $upload->id,
            'user_id' => $upload->user_id,
            'purpose' => $upload->purpose->value,
            'signature' => $signature,
        ]);
    }
}
