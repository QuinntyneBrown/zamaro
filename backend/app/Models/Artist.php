<?php

namespace App\Models;

use App\Enums\ActType;
use App\Enums\ArtistStatus;
use App\Enums\Pronoun;
use App\Enums\Style;
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
            'pronoun' => Pronoun::class,
            'languages' => 'array',
        ];
    }

    /** What profile copy calls the artist: a solo act's first name, a group's whole name. */
    public function firstName(): string
    {
        return $this->act_type === ActType::Solo ? strtok($this->display_name, ' ') : $this->display_name;
    }

    public function setlist(): HasMany
    {
        return $this->hasMany(SetlistSong::class)->orderBy('position');
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

    /** In the chips' order (the Style enum), so every card and profile lists them alike. */
    public function styles(): HasMany
    {
        $order = implode(',', array_map(fn (Style $style) => "'{$style->value}'", Style::cases()));

        return $this->hasMany(ArtistStyle::class)->orderByRaw("array_position(ARRAY[{$order}]::text[], style)");
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
