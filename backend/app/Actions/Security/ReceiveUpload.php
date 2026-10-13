<?php

namespace App\Actions\Security;

use App\Enums\UploadPurpose;
use App\Enums\UploadStatus;
use App\Jobs\Security\ScanUpload;
use App\Models\Upload;
use App\Models\User;
use App\Services\Security\ContentTypeDetector;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * The front door for every file (L2-076.1): its type is read from its content and checked against
 * the purpose's list, the bytes go to quarantine under a random name, and the scan is queued. Nothing
 * is served or processed before the verdict.
 */
class ReceiveUpload
{
    public function __construct(private readonly ContentTypeDetector $detector) {}

    /**
     * @throws ValidationException on `file` when the content is not a type the purpose accepts
     */
    public function handle(User $user, UploadedFile $file, UploadPurpose $purpose): Upload
    {
        $mime = $this->detector->detect($file->getRealPath());
        if ($mime === null || ! in_array($mime, $purpose->allowedTypes(), true)) {
            throw ValidationException::withMessages(['file' => $purpose->wrongTypeMessage()]);
        }

        $key = (string) Str::uuid();
        $stream = fopen($file->getRealPath(), 'rb');
        Storage::disk(config('zamaro.uploads.disks.quarantine'))->put($key, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        $upload = Upload::create([
            'user_id' => $user->id,
            'purpose' => $purpose,
            'detected_mime' => $mime,
            'size_bytes' => $file->getSize(),
            'quarantine_key' => $key,
            'status' => UploadStatus::Quarantined,
        ]);
        ScanUpload::dispatch($upload->id)->afterCommit();

        return $upload;
    }
}
