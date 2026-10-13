<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One slug an artist has held; `retired_at` is null for the current one (ADR-0011). */
class SlugHistory extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'retired_at' => 'immutable_datetime',
        ];
    }

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }
}
