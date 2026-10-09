<?php

return [

    // Release version written to every log line (L2-093).
    'release' => env('APP_RELEASE', 'dev'),

    'problems' => [
        // Base of the RFC 9457 problem `type` URIs, e.g. {base}/not-found (ADR-0005).
        'base_uri' => env('ZAMARO_PROBLEM_BASE_URI', rtrim(env('APP_URL', 'http://localhost'), '/').'/problems'),
    ],

    'health' => [
        // Connect and read timeout for each readiness check.
        'timeout_ms' => (int) env('ZAMARO_HEALTH_TIMEOUT_MS', 500),
    ],

];
