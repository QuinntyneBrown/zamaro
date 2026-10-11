<?php

namespace App\Enums;

/** A theme chosen with the toggle (L2-104); none means the device decides. */
enum ThemePreference: string
{
    case Light = 'light';
    case Dark = 'dark';
}
