<?php

return [

    // Zamaro Web's address, for links in emails, which are sent with no request to take it from.
    'web_url' => rtrim(env('ZAMARO_WEB_URL', 'http://localhost:4200'), '/'),

    // Release version written to every log line (L2-093).
    'release' => env('APP_RELEASE', 'dev'),

    // Test environments only: freeze "now" (e.g. 2026-10-09T10:00:00-04:00). Production never
    // reaches it, because it refuses to boot with fake adapters.
    'frozen_now' => env('ZAMARO_FROZEN_NOW'),

    // The password Naomi, Abigail and Tomi sign in with (M2 D28). The cast seeder uses it only in
    // local, testing and e2e; anywhere else, and when it is empty, their passwords stay random.
    'cast_password' => env('ZAMARO_CAST_PASSWORD'),

    'problems' => [
        // Base of the RFC 9457 problem `type` URIs, e.g. {base}/not-found (ADR-0005).
        'base_uri' => env('ZAMARO_PROBLEM_BASE_URI', rtrim(env('APP_URL', 'http://localhost'), '/').'/problems'),
    ],

    'rate_limits' => [
        // L2-077.1: anonymous /api/v1 requests per address, and per account once signed in (M2 D7).
        // The e2e API raises both: every browser in the suite shares one address.
        'api_per_minute' => (int) env('ZAMARO_API_LIMIT_PER_MINUTE', 120),
        'api_signed_in_per_minute' => (int) env('ZAMARO_API_SIGNED_IN_LIMIT_PER_MINUTE', 300),
        // L2-077.2, per address and per account. The e2e API raises it too.
        'search_per_minute' => (int) env('ZAMARO_SEARCH_LIMIT_PER_MINUTE', 30),
        // Registrations per address (M2 D6). The e2e API raises it too.
        'register_per_hour' => (int) env('ZAMARO_REGISTER_LIMIT_PER_HOUR', 10),
    ],

    // What the fake vendor adapters answer (ADR-0002).
    'fakes' => [
        // Passwords FakeBreachedPasswordChecker reports as breached.
        'breached_passwords' => ['password1234', 'qwertyuiop123', 'iloveyou1234'],
    ],

    'media' => [
        // The disk holding photo renditions, posters, streams and captions. M1 has no object
        // storage: the local `media` disk is served under /media. M4 switches it to object storage.
        'disk' => env('ZAMARO_MEDIA_DISK', 'media'),
    ],

    // Unfinished features, off unless the environment turns them on (ADR-0012). The frontend reads
    // them from GET /api/v1/features.
    'features' => [
        // Sending a booking request from the profile's booking stub (M5).
        'booking_requests' => (bool) env('ZAMARO_FEATURE_BOOKING_REQUESTS', false),
    ],

    'i18n' => [
        // One directory per locale, one JSON file per namespace (L2-111).
        'path' => env('ZAMARO_I18N_PATH', resource_path('i18n')),
    ],

];
