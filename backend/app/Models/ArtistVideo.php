<?php

namespace App\Models;

use App\Enums\VideoStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArtistVideo extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['position' => 'integer', 'status' => VideoStatus::class, 'duration_seconds' => 'integer'];
    }

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }

    /** Processed and streamable; the only videos the public sees (L2-014.3). */
    public function scopeLive(Builder $query): void
    {
        $query->where('status', VideoStatus::Live);
    }
}
