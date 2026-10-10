<?php

namespace App\Models;

use App\Enums\Style;
use Illuminate\Database\Eloquent\Model;

/** One style an artist offers; keyed by (artist_id, style). */
class ArtistStyle extends Model
{
    protected $primaryKey = null;

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['style' => Style::class];
    }
}
