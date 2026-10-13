<?php

namespace App\Enums;

/** Where a consent record was given: the sign-up form, the updated-terms page or account settings. */
enum ConsentSource: string
{
    case Registration = 'registration';
    case TermsUpdate = 'terms-update';
    case Settings = 'settings';
}
