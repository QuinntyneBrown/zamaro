<?php

namespace App\Enums;

/** What an upload is for, which decides the types it may be (scan-and-serve-uploads). */
enum UploadPurpose: string
{
    case VscDocument = 'vsc_document';
    case Photo = 'photo';
    case Video = 'video';
    case Caption = 'caption';

    /** @return list<string> the content types the purpose accepts */
    public function allowedTypes(): array
    {
        return match ($this) {
            self::VscDocument => ['application/pdf', 'image/jpeg', 'image/png'],
            self::Photo => ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
            self::Video => ['video/mp4', 'video/quicktime', 'video/webm'],
            self::Caption => ['text/vtt'],
        };
    }

    /** What the person reads when the file is not one of those types (M3 D11). */
    public function wrongTypeMessage(): string
    {
        return match ($this) {
            self::VscDocument => 'This file isn’t a PDF, JPEG or PNG. Choose a scan of the whole check.',
            self::Photo => 'This file isn’t a JPEG, PNG, WebP or HEIC photo.',
            self::Video => 'This file isn’t an MP4, MOV or WebM video.',
            self::Caption => 'This file isn’t a WebVTT caption file.',
        };
    }
}
