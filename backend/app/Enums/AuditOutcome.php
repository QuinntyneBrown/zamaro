<?php

namespace App\Enums;

enum AuditOutcome: string
{
    case Succeeded = 'succeeded';
    case Failed = 'failed';
    case Denied = 'denied';
}
