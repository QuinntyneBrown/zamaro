<?php

namespace App\Casts;

use App\Support\Encryption\FieldEncrypter;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Encrypts a column with the field key on write and decrypts it on read (L2-079.2). The column is
 * `text` and never used in a `WHERE` clause.
 *
 * @implements CastsAttributes<string|null, string|null>
 */
class EncryptedField implements CastsAttributes
{
    /** @param  array<string, mixed>  $attributes */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $value === null ? null : app(FieldEncrypter::class)->decrypt($value);
    }

    /** @param  array<string, mixed>  $attributes */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $value === null ? null : app(FieldEncrypter::class)->encrypt((string) $value);
    }
}
