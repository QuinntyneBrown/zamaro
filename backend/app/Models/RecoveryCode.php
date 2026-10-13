<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One single-use two-step recovery code's SHA-256 and when it was used. */
class RecoveryCode extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = [];

    /** The columns are timestamptz: write the offset, so Toronto times are not read as UTC. */
    protected $dateFormat = 'Y-m-d H:i:sO';

    protected function casts(): array
    {
        return ['used_at' => 'immutable_datetime', 'created_at' => 'immutable_datetime'];
    }
}
