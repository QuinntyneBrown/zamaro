<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Serves the media disk in place of the CDN while it is local (M1). Only the media types the
 * profile uses are served, each with the type the server sets, never one sniffed (L2-076.3); the
 * player on the web origin reads streams and captions across origins, so any origin may.
 */
class MediaController extends Controller
{
    private const TYPES = [
        'webp' => 'image/webp',
        'avif' => 'image/avif',
        'm3u8' => 'application/vnd.apple.mpegurl',
        'mp4' => 'video/mp4',
        'm4s' => 'video/iso.segment',
        'vtt' => 'text/vtt',
    ];

    public function show(string $path): Response
    {
        $type = self::TYPES[pathinfo($path, PATHINFO_EXTENSION)] ?? null;
        $disk = Storage::disk(config('zamaro.media.disk'));
        if ($type === null || str_contains($path, '..') || ! $disk->exists($path)) {
            throw new NotFoundHttpException('No media file has that address.');
        }

        return response($disk->get($path), 200, [
            'Content-Type' => $type,
            'Content-Disposition' => 'inline',
            'X-Content-Type-Options' => 'nosniff',
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
