<?php

namespace App\Actions\ArtistOnboarding;

use App\Enums\VideoStatus;
use App\Models\ArtistVideo;
use Illuminate\Support\Str;

/**
 * An applicant names a video and how big it is, and gets the token every later chunk, the offset
 * question and the submission use (apply-as-artist, ADR-0026). The row has no artist and no
 * application yet; `uploads:prune-unattached` deletes it after 24 hours if neither arrives.
 */
class StartApplicationVideoUpload
{
    public function handle(string $title, string $fileName, int $sizeBytes): ArtistVideo
    {
        return ArtistVideo::create([
            'position' => 1,
            'title' => $title,
            'file_name' => $fileName,
            'size_bytes' => $sizeBytes,
            'uploaded_bytes' => 0,
            'status' => VideoStatus::Uploading,
            'upload_token' => Str::lower(bin2hex(random_bytes(32))),
        ]);
    }
}
