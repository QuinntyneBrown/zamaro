<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An email change link's stored half: the SHA-256 of the token, the new address, its expiry and use. */
class EmailChangeToken extends Model
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
            'created_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isUsable(): bool
    {
        return $this->used_at === null && $this->expires_at->isFuture();
    }
}
