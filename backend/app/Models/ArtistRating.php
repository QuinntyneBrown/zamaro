<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Mean rating over distinct churches; null until the first review (L2-060). */
class ArtistRating extends Model
{
    protected $primaryKey = 'artist_id';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['rating' => 'float', 'review_count' => 'integer', 'recalculated_at' => 'immutable_datetime'];
    }
}
