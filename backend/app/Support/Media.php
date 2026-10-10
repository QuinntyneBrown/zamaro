<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Public URLs for keys on the media disk. In M1 the disk is the API's local disk, served under
 * /media; M4 points `zamaro.media.disk` at object storage behind the CDN without touching callers.
 */
class Media
{
    public static function url(string $key): string
    {
        return Storage::disk(config('zamaro.media.disk'))->url($key);
    }
}
