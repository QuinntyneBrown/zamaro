<?php

return [

    // Only Zamaro Web's origins (ZAMARO_WEB_ORIGINS) may call the API from a browser, with the session
    // cookie (ADR-0015). Production serves both through one origin, so its browsers never ask.
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    'allowed_origins' => array_map(
        fn (string $origin) => rtrim($origin, '/'),
        explode(',', env('ZAMARO_WEB_ORIGINS', 'http://localhost:4200,http://localhost:4000')),
    ),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Content-Type', 'X-Requested-With', 'X-XSRF-TOKEN', 'X-Request-Id'],

    'exposed_headers' => ['Retry-After', 'X-Request-Id'],

    'max_age' => 0,

    'supports_credentials' => true,

];
