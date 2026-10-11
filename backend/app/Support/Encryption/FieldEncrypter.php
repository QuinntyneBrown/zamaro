<?php

namespace App\Support\Encryption;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Application-level encryption of named columns (L2-079.2): AES-256-GCM with the field key, never
 * APP_KEY. A value is `{version}:{payload}`, so values written under a previous key still decrypt
 * while new ones use the current key (security/protect-secrets-and-data, ADR-0020).
 */
class FieldEncrypter
{
    private const CIPHER = 'aes-256-gcm';

    public function encrypt(string $plain): string
    {
        [$version, $key] = $this->currentKey();

        return $version.':'.$this->encrypter($key)->encryptString($plain);
    }

    /**
     * @throws DecryptException when the value names a key this API does not hold, or was tampered with
     */
    public function decrypt(string $stored): string
    {
        $version = Str::before($stored, ':');
        $key = $this->keys()[$version] ?? throw new DecryptException("No field key for version {$version}.");

        return $this->encrypter($key)->decryptString(Str::after($stored, ':'));
    }

    /** @return array{string, string} */
    private function currentKey(): array
    {
        $version = (string) config('security.field_encryption.version');

        return [$version, $this->keys()[$version]];
    }

    /** @return array<string, string> raw 32-byte keys by version, the current one included */
    private function keys(): array
    {
        $current = config('security.field_encryption.key');
        if (blank($current)) {
            throw new RuntimeException('FIELD_ENCRYPTION_KEY is not set.');
        }

        $keys = [];
        foreach (array_filter(explode(',', (string) config('security.field_encryption.previous_keys'))) as $pair) {
            $keys[trim(Str::before($pair, ':'))] = self::decode(trim(Str::after($pair, ':')));
        }
        $keys[(string) config('security.field_encryption.version')] = self::decode($current);

        return $keys;
    }

    private function encrypter(string $key): Encrypter
    {
        return new Encrypter($key, self::CIPHER);
    }

    private static function decode(string $key): string
    {
        return str_starts_with($key, 'base64:') ? base64_decode(substr($key, 7), true) : $key;
    }
}
