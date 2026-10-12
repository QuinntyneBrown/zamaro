<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Review extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'stars' => 'integer',
            'created_at' => 'immutable_datetime',
            'edited_at' => 'immutable_datetime',
            'hidden_at' => 'immutable_datetime',
        ];
    }

    /** Not hidden by moderation. */
    public function scopeVisible(Builder $query): void
    {
        $query->whereNull('hidden_at');
    }

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }

    public function booker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booker_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function reply(): HasOne
    {
        return $this->hasOne(ReviewReply::class);
    }
}
