<?php

return [
    /*
     * Field encryption (L2-079.2, security/protect-secrets-and-data, ADR-0020): phone numbers and other
     * named columns are encrypted by the API with a key that is not APP_KEY and never in the database.
     * Each value starts with the version of the key that wrote it; `previous_keys` lists earlier keys
     * as `version:key` pairs, comma-separated, so their values still read after a rotation.
     */
    'field_encryption' => [
        'version' => env('FIELD_ENCRYPTION_KEY_VERSION', 'v1'),
        'key' => env('FIELD_ENCRYPTION_KEY'),
        'previous_keys' => env('FIELD_ENCRYPTION_PREVIOUS_KEYS', ''),
    ],
];
