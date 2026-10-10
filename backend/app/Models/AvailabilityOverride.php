<?php

namespace App\Models;

use App\Enums\OverrideState;
use Illuminate\Database\Eloquent\Model;

class AvailabilityOverride extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['date' => 'immutable_date', 'state' => OverrideState::class];
    }
}
