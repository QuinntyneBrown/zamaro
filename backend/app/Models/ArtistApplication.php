<?php

namespace App\Models;

use App\Enums\ActType;
use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One applicant's submitted details, videos and references, with status Submitted, Approved or
 * Rejected (apply-as-artist, L2-047). `user_id` is set when the applicant was signed in; the review
 * slice resolves the account on approval.
 */
class ArtistApplication extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'act_type' => ActType::class,
            'status' => ApplicationStatus::class,
            'styles' => 'array',
            'from_price_cents' => 'integer',
            'max_drive_km' => 'integer',
            'submitted_at' => 'immutable_datetime',
            'decided_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<ApplicationReference, $this> */
    public function references(): HasMany
    {
        return $this->hasMany(ApplicationReference::class)->orderBy('id');
    }

    /** @return HasMany<ArtistVideo, $this> */
    public function videos(): HasMany
    {
        return $this->hasMany(ArtistVideo::class)->orderBy('position');
    }
}
