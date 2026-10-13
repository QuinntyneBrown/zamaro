<?php

namespace App\Services\ArtistOnboarding;

use App\Support\Encryption\FieldEncrypter;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Private documents at rest (L2-049.1, L2-079.2, ADR-0025): each file is encrypted with its own
 * random data key (AES-256-GCM), and that key is wrapped with the versioned field key, so the
 * ciphertext on the documents disk means nothing without both. Objects live under random names.
 */
class DocumentVault
{
    private const CIPHER = 'aes-256-gcm';

    private const IV_BYTES = 12;

    private const TAG_BYTES = 16;

    public function __construct(private readonly FieldEncrypter $keys) {}

    /**
     * Encrypts and stores `$plaintext` under a new random name, or under `$key` (32 hex) when the caller
     * must rewrite the same object, as the seeder does.
     *
     * @return array{key: string, wrappedDataKey: string}
     */
    public function store(string $plaintext, ?string $key = null): array
    {
        $key ??= bin2hex(random_bytes(16));
        $dataKey = random_bytes(32);
        $iv = random_bytes(self::IV_BYTES);
        $ciphertext = openssl_encrypt($plaintext, self::CIPHER, $dataKey, OPENSSL_RAW_DATA, $iv, $tag, '', self::TAG_BYTES);
        if ($ciphertext === false) {
            throw new RuntimeException('The document could not be encrypted.');
        }
        $this->disk()->put($key, $iv.$tag.$ciphertext);

        return ['key' => $key, 'wrappedDataKey' => $this->keys->encrypt(base64_encode($dataKey))];
    }

    /** The plaintext of a stored document. */
    public function read(string $key, string $wrappedDataKey): string
    {
        $dataKey = base64_decode($this->keys->decrypt($wrappedDataKey), true);
        $stored = $this->disk()->get($key);
        if ($dataKey === false || $stored === null) {
            throw new RuntimeException('The document could not be read.');
        }
        $iv = substr($stored, 0, self::IV_BYTES);
        $tag = substr($stored, self::IV_BYTES, self::TAG_BYTES);
        $plaintext = openssl_decrypt(substr($stored, self::IV_BYTES + self::TAG_BYTES), self::CIPHER, $dataKey, OPENSSL_RAW_DATA, $iv, $tag);
        if ($plaintext === false) {
            throw new RuntimeException('The document could not be decrypted.');
        }

        return $plaintext;
    }

    public function delete(string $key): void
    {
        $this->disk()->delete($key);
    }

    public function disk(): Filesystem
    {
        return Storage::disk(config('zamaro.uploads.disks.documents'));
    }
}
