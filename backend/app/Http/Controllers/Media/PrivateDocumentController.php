<?php

namespace App\Http\Controllers\Media;

use App\Enums\VscStatus;
use App\Http\Controllers\Controller;
use App\Models\VulnerableSectorCheck;
use App\Services\ArtistOnboarding\DocumentVault;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Streams a private document behind a valid signed link (L2-076.3, L2-089): decrypted on the way out,
 * as a download with the server's own type and name, never cached, never sniffed, never scripted.
 */
class PrivateDocumentController extends Controller
{
    private const EXTENSIONS = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];

    public function show(string $key, DocumentVault $vault): StreamedResponse
    {
        $check = VulnerableSectorCheck::where('storage_key', $key)
            ->whereIn('status', [VscStatus::Pending->value, VscStatus::Verified->value])
            ->firstOrFail();
        $bytes = $vault->read($check->storage_key, $check->wrapped_data_key);
        $extension = self::EXTENSIONS[$check->mime_type] ?? 'bin';

        return new StreamedResponse(function () use ($bytes) {
            echo $bytes;
        }, 200, [
            'Content-Type' => $check->mime_type,
            'Content-Length' => (string) strlen($bytes),
            'Content-Disposition' => 'attachment; filename="vulnerable-sector-check.'.$extension.'"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
        ]);
    }
}
