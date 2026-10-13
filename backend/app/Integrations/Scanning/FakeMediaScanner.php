<?php

namespace App\Integrations\Scanning;

use App\Contracts\MediaScanner;
use App\Contracts\ScanResult;

/**
 * The scanner's fake (ADR-0002): the EICAR test string is malware, a file carrying
 * `SCANNER-UNAVAILABLE` cannot be scanned (so the job retries), and everything else is clean.
 */
class FakeMediaScanner implements MediaScanner
{
    public const EICAR = 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

    public const UNAVAILABLE = 'SCANNER-UNAVAILABLE';

    public function scan(mixed $stream): ScanResult
    {
        $contents = stream_get_contents($stream);

        return match (true) {
            str_contains($contents, self::UNAVAILABLE) => ScanResult::error(),
            str_contains($contents, self::EICAR) => ScanResult::infected('EICAR-Test-File'),
            default => ScanResult::clean(),
        };
    }
}
