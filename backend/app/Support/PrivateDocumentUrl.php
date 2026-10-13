<?php

namespace App\Support;

use App\Models\VulnerableSectorCheck;
use Illuminate\Support\Facades\URL;

/** A 5-minute signed link to a private document on the media host (L2-076.3, scan-and-serve-uploads). */
class PrivateDocumentUrl
{
    public const MINUTES = 5;

    /** @return array{url: string, expiresAt: string} */
    public static function for(VulnerableSectorCheck $check): array
    {
        $expires = now()->addMinutes(self::MINUTES);

        return [
            'url' => URL::temporarySignedRoute('documents.show', $expires, ['key' => $check->storage_key]),
            'expiresAt' => $expires->toIso8601String(),
        ];
    }
}
