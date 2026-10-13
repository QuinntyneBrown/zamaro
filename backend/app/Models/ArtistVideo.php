<?php

namespace App\Models;

use App\Enums\VideoStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A performance video (L2-052): an artist's, or an applicant's while the application is in review,
 * when it has an upload token and no artist yet (apply-as-artist, ADR-0026).
 */
class ArtistVideo extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'status' => VideoStatus::class,
            'duration_seconds' => 'integer',
            'size_bytes' => 'integer',
            'uploaded_bytes' => 'integer',
        ];
    }

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }

    /** @return BelongsTo<Upload, $this> */
    public function upload(): BelongsTo
    {
        return $this->belongsTo(Upload::class);
    }

    /** Uploaded by an applicant and not yet part of a submitted application. */
    public function scopeUnattached(Builder $query): void
    {
        $query->whereNull('artist_id')->whereNull('artist_application_id')->whereNotNull('upload_token');
    }

    /** Processed and streamable; the only videos the public sees (L2-014.3). */
    public function scopeLive(Builder $query): void
    {
        $query->where('status', VideoStatus::Live);
    }
}
