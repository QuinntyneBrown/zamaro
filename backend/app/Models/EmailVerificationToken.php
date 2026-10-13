<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A single-use verification link's stored half: the SHA-256 of the token, its expiry and its use. */
class EmailVerificationToken extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = [];

    /** The columns are timestamptz: write the offset, so Toronto times are not read as UTC. */
    protected $dateFormat = 'Y-m-d H:i:sO';

    protected function casts(): array
    {
        return [
            'expires_at' => 'immutable_datetime',
            'used_at' => 'immutable_datetime',
        ];
    }
}
