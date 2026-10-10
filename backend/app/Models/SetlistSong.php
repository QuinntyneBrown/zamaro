<?php

namespace App\Models;

use App\Enums\MusicalKey;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SetlistSong extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['position' => 'integer', 'key' => MusicalKey::class];
    }
}
