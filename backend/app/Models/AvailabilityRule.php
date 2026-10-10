<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A weekly default: the artist is unavailable every `weekday` (ISO, 1 = Monday). */
class AvailabilityRule extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['weekday' => 'integer', 'unavailable' => 'boolean'];
    }
}
