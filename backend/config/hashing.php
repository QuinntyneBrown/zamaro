<?php

return [

    // Argon2id for every password (L2-072.2). Laravel's defaults: 64 MiB, 4 passes, 1 thread (M2 D1).
    // The test suite lowers the cost through ARGON_MEMORY and ARGON_TIME in phpunit.xml.
    'driver' => env('HASH_DRIVER', 'argon2id'),

    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 12),
        'verify' => env('HASH_VERIFY', true),
        'limit' => env('BCRYPT_LIMIT', null),
    ],

    'argon' => [
        'memory' => (int) env('ARGON_MEMORY', 65536),
        'threads' => (int) env('ARGON_THREADS', 1),
        'time' => (int) env('ARGON_TIME', 4),
        'verify' => env('HASH_VERIFY', true),
    ],

    'rehash_on_login' => true,

];
