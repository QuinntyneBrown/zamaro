<?php

namespace App\Enums;

/** Where an upload stands: in quarantine until the scan, then clean, or rejected and deleted. */
enum UploadStatus: string
{
    case Quarantined = 'quarantined';
    case Clean = 'clean';
    case Rejected = 'rejected';
}
