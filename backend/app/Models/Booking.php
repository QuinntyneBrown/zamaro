<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\GatheringKind;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => BookingStatus::class,
            'kind' => GatheringKind::class,
            'event_date' => 'immutable_date',
        ];
    }

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }
}
