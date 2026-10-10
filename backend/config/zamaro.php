<?php

return [

    // Release version written to every log line (L2-093).
    'release' => env('APP_RELEASE', 'dev'),

    // Test environments only: freeze "now" (e.g. 2026-10-09T10:00:00-04:00). Production never
    // reaches it, because it refuses to boot with fake adapters.
    'frozen_now' => env('ZAMARO_FROZEN_NOW'),

    'problems' => [
        // Base of the RFC 9457 problem `type` URIs, e.g. {base}/not-found (ADR-0005).
        'base_uri' => env('ZAMARO_PROBLEM_BASE_URI', rtrim(env('APP_URL', 'http://localhost'), '/').'/problems'),
    ],

    'i18n' => [
        // One directory per locale, one JSON file per namespace (L2-111).
        'path' => env('ZAMARO_I18N_PATH', resource_path('i18n')),
    ],

];
