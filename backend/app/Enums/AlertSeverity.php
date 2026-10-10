<?php

namespace App\Enums;

/** How urgently an alert reaches the on-call person: Critical pages them, Warning waits for working hours. */
enum AlertSeverity: string
{
    case Critical = 'critical';
    case Warning = 'warning';
}
