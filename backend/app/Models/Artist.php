<?php

namespace App\Models;

use App\Enums\ActType;
use App\Enums\ArtistStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Artist extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'act_type' => ActType::class,
            'status' => ArtistStatus::class,
            'base_latitude' => 'float',
            'base_longitude' => 'float',
            'payout_ready' => 'boolean',
            'published_at' => 'immutable_datetime',
        ];
    }

    /** Shown to the public: approved, payout set up and published (L2-005.4, L2-048.3). */
    public function scopeVisible(Builder $query): void
    {
        $query->where('status', ArtistStatus::Approved)
            ->where('payout_ready', true)
            ->whereNotNull('published_at');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function styles(): HasMany
    {
        return $this->hasMany(ArtistStyle::class);
    }

    public function rating(): HasOne
    {
        return $this->hasOne(ArtistRating::class);
    }

    public function availabilityRules(): HasMany
    {
        return $this->hasMany(AvailabilityRule::class);
    }

    public function availabilityOverrides(): HasMany
    {
        return $this->hasMany(AvailabilityOverride::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
