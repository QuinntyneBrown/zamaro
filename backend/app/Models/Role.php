<?php

namespace App\Models;

use App\Enums\Role as RoleName;
use Illuminate\Database\Eloquent\Model;

/** One row per App\Enums\Role, seeded by its migration. */
class Role extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'name' => RoleName::class,
        ];
    }
}
