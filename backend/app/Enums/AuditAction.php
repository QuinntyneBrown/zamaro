<?php

namespace App\Enums;

/** Every audited action (administration/record-audit-log); the list grows with each slice. */
enum AuditAction: string
{
    case SignIn = 'auth.sign_in';
    case SignInFailed = 'auth.sign_in_failed';
    case PasswordReset = 'auth.password_reset';
    case PasswordChanged = 'auth.password_changed';
    case EmailChanged = 'account.email_changed';
    case TwoFactorEnabled = 'auth.two_factor_enabled';
    case TwoFactorDisabled = 'auth.two_factor_disabled';
    case RecoveryCodesReplaced = 'auth.recovery_codes_replaced';
}
