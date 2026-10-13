<?php

namespace App\Enums;

/** The fixed list a rejection must pick from (L2-048.2); the applicant reads the label in the email. */
enum ApplicationRejectionReason: string
{
    case ReferencesUnconfirmed = 'references-unconfirmed';
    case VideosNotWorship = 'videos-not-worship';
    case OutsideServiceArea = 'outside-service-area';
    case IncompleteOrInaccurate = 'incomplete-or-inaccurate';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::ReferencesUnconfirmed => 'References could not be confirmed',
            self::VideosNotWorship => 'Videos don’t show you leading worship',
            self::OutsideServiceArea => 'Outside the Zamaro service area',
            self::IncompleteOrInaccurate => 'Application incomplete or inaccurate',
            self::Other => 'Other',
        };
    }
}
