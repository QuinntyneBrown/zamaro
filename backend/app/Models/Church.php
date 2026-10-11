<?php

namespace App\Models;

use App\Casts\EncryptedField;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A booker's church (accounts/manage-church-profile): who is asking, where the event is and how to
 * reach the church once a booking is confirmed. The phone is stored encrypted in E.164 (L2-079.2).
 */
class Church extends Model
{
    protected $guarded = [];

    /** The columns are timestamptz: write the offset, so Toronto times are not read as UTC. */
    protected $dateFormat = 'Y-m-d H:i:sO';

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'phone' => EncryptedField::class,
            'typical_attendance' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function booker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booker_id');
    }
}
