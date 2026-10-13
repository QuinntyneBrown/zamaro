<?php

namespace App\Contracts;

/**
 * The malware scanner every upload passes before it leaves quarantine (L2-076.1, ADR-0002). The
 * vendor is chosen in M10; until then the fake decides by content.
 */
interface MediaScanner
{
    /** Scans the bytes on `$stream` (a readable resource) and answers a verdict. */
    public function scan(mixed $stream): ScanResult;
}
