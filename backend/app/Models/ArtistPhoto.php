<?php

namespace App\Models;

use App\Enums\MediaStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property list<array{width: int, height: int, format: string, key: string}> $renditions
 */
class ArtistPhoto extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_primary' => 'boolean',
            'status' => MediaStatus::class,
            'renditions' => 'array',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }

    public function scopeLive(Builder $query): void
    {
        $query->where('status', MediaStatus::Live);
    }
}
