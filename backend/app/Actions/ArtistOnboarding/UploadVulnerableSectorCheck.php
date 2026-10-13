<?php

namespace App\Actions\ArtistOnboarding;

use App\Actions\Security\ReceiveUpload;
use App\Enums\UploadPurpose;
use App\Enums\VscStatus;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * An artist uploads a Police Vulnerable Sector Check with its issue date (L2-049.1). The file goes
 * through the upload pipeline; the check is `Scanning` until the scan passes, then waits for an
 * administrator. The check belongs to the person, not the artist row, so it survives either way.
 */
class UploadVulnerableSectorCheck
{
    public function __construct(private readonly ReceiveUpload $receive) {}

    /**
     * @throws ValidationException on `file` when the content is not a PDF, JPEG or PNG
     */
    public function handle(User $user, UploadedFile $file, CarbonImmutable $issuedOn): VulnerableSectorCheck
    {
        return DB::transaction(function () use ($user, $file, $issuedOn) {
            $upload = $this->receive->handle($user, $file, UploadPurpose::VscDocument);

            return VulnerableSectorCheck::create([
                'user_id' => $user->id,
                'upload_id' => $upload->id,
                'issued_on' => $issuedOn->toDateString(),
                'expires_on' => null,
                'status' => VscStatus::Scanning,
            ]);
        });
    }
}
