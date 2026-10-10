<?php

namespace App\Models;

use App\Enums\VscStatus;
use Illuminate\Database\Eloquent\Model;

/** Valid for three years from issue (L2-049). */
class VulnerableSectorCheck extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => VscStatus::class,
            'issued_on' => 'immutable_date',
            'expires_on' => 'immutable_date',
            'verified_at' => 'immutable_datetime',
        ];
    }
}
