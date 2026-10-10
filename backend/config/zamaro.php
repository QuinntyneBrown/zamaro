<?php

return [

    // Release version written to every log line (L2-093).
    'release' => env('APP_RELEASE', 'dev'),

    'problems' => [
        // Base of the RFC 9457 problem `type` URIs, e.g. {base}/not-found (ADR-0005).
        'base_uri' => env('ZAMARO_PROBLEM_BASE_URI', rtrim(env('APP_URL', 'http://localhost'), '/').'/problems'),
    ],

    'rate_limits' => [
        // L2-077.2: searches per minute from one address.
        'search_per_minute' => (int) env('ZAMARO_SEARCH_LIMIT_PER_MINUTE', 30),
    ],

    'i18n' => [
        // One directory per locale, one JSON file per namespace (L2-111).
        'path' => env('ZAMARO_I18N_PATH', resource_path('i18n')),
    ],

];
