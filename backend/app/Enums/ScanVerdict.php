<?php

namespace App\Enums;

/** What the malware scanner says about a file. `Error` means it could not say, and the job retries. */
enum ScanVerdict: string
{
    case Clean = 'clean';
    case Infected = 'infected';
    case Error = 'error';
}
