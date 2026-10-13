<?php

use Illuminate\Support\Facades\Schedule;

// Zamaro Worker's schedule (ADR-0002). Times are in the app's timezone, America/Toronto.

// Audit entries older than 2 years go daily, in batches of 1,000 (L2-069.3, M3 D14).
Schedule::command('audit:prune')->dailyAt('03:30');

// Artists whose verified Vulnerable Sector Check runs out within 60 days are reminded, once each
// (L2-049.3); a missed morning is caught the next (L2-092.3).
Schedule::command('vsc:send-renewal-reminders')->dailyAt('09:00');

// An applicant's video no application claimed within 24 hours is deleted with its files (M3 D7).
Schedule::command('uploads:prune-unattached')->dailyAt('04:00');
