<?php

namespace App\Models;

use App\Enums\ConsentKind;
use App\Enums\ConsentSource;
use Illuminate\Database\Eloquent\Model;

/** One append-only consent: what, which version, the choice, when and from where. Written only by RecordConsent. */
class ConsentRecord extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    /** The columns are timestamptz: write the offset, so Toronto times are not read as UTC. */
    protected $dateFormat = 'Y-m-d H:i:sO';

    protected function casts(): array
    {
        return [
            'kind' => ConsentKind::class,
            'source' => ConsentSource::class,
            'granted' => 'boolean',
            'recorded_at' => 'immutable_datetime',
        ];
    }
}
