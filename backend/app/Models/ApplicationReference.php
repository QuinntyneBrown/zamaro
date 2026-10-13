<?php

namespace App\Models;

use App\Casts\EncryptedField;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A church reference on an application (L2-047.1): a name, a church, and a phone or an email, kept
 * encrypted (L2-079.2) and shown to administrators only (review-artist-application).
 */
class ApplicationReference extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'phone' => EncryptedField::class,
            'email' => EncryptedField::class,
            'verified_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<ArtistApplication, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(ArtistApplication::class, 'artist_application_id');
    }
}
