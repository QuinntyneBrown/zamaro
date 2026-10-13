<?php

namespace App\Models;

use App\Enums\VscStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A Police Vulnerable Sector Check an artist uploaded (L2-049): scanned, then waiting for an
 * administrator, then verified for three years from its issue date. The document itself is
 * ciphertext on the private documents disk under `storage_key`, readable through DocumentVault.
 */
class VulnerableSectorCheck extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => VscStatus::class,
            'issued_on' => 'immutable_date',
            'expires_on' => 'immutable_date',
            'verified_at' => 'immutable_datetime',
            'renewal_reminder_sent_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Upload, $this> */
    public function upload(): BelongsTo
    {
        return $this->belongsTo(Upload::class);
    }

    /** @return BelongsTo<User, $this> */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
