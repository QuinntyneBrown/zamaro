<?php

namespace App\Enums;

/** What a consent record is about (privacy/record-consent). Legal documents are the first two. */
enum ConsentKind: string
{
    case Terms = 'terms';
    case PrivacyPolicy = 'privacy-policy';
    case MarketingEmail = 'marketing-email';
}
