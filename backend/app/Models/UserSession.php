<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One signed-in session in the registry, keyed by the SHA-256 of its ID (SessionRegistry). */
class UserSession extends Model
{
    public const UPDATED_AT = null;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    /** The columns are timestamptz: write the offset, so Toronto times are not read as UTC. */
    protected $dateFormat = 'Y-m-d H:i:sO';

    protected $hidden = ['encrypted_session_id'];

    protected function casts(): array
    {
        return [
            'encrypted_session_id' => 'encrypted',
            'last_active_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
        ];
    }
}
