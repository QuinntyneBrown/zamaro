<?php

namespace App\Services\Security;

use finfo;

/**
 * What a file really is (L2-076.1): its type from its leading bytes (libmagic), never from its name
 * or the declared type. SVG, HTML and XHTML are refused in any form, and so is any file whose first
 * bytes look like XML or HTML, whatever it is called or meant for.
 */
class ContentTypeDetector
{
    private const REFUSED = ['image/svg+xml', 'text/html', 'application/xhtml+xml', 'text/xml', 'application/xml'];

    /** The detected type, or null when the file is refused outright. */
    public function detect(string $path): ?string
    {
        $head = (string) file_get_contents($path, length: 512);
        if ($this->looksLikeMarkup($head)) {
            return null;
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path) ?: 'application/octet-stream';

        return in_array($mime, self::REFUSED, true) ? null : $mime;
    }

    /** The first bytes, past any BOM and whitespace, open a tag. */
    private function looksLikeMarkup(string $head): bool
    {
        $head = ltrim(preg_replace('/^\xEF\xBB\xBF/', '', $head) ?? $head);

        return str_starts_with($head, '<');
    }
}
