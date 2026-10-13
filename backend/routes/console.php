<?php

use Illuminate\Support\Facades\Schedule;

// Zamaro Worker's schedule (ADR-0002). Times are in the app's timezone, America/Toronto.

// Audit entries older than 2 years go daily, in batches of 1,000 (L2-069.3, M3 D14).
Schedule::command('audit:prune')->dailyAt('03:30');
