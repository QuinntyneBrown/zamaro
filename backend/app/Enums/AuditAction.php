<?php

namespace App\Enums;

/** Every audited action (administration/record-audit-log); the list grows with each slice. */
enum AuditAction: string
{
    case SignIn = 'auth.sign_in';
    case SignInFailed = 'auth.sign_in_failed';
}
