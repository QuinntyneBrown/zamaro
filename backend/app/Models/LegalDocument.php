<?php

namespace App\Models;

use App\Enums\ConsentKind;
use Illuminate\Database\Eloquent\Model;

/** One published version of the terms of use or the privacy policy (privacy/record-consent). */
class LegalDocument extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'kind' => ConsentKind::class,
            'effective_from' => 'immutable_date',
            'summary_of_changes' => 'array',
        ];
    }
}
