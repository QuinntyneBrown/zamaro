<?php

namespace App\Models;

use App\Enums\AuditAction;
use App\Enums\AuditOutcome;
use Illuminate\Database\Eloquent\Model;

/** One line of the append-only audit log; written only by RecordAuditEntry. */
class AuditEntry extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'action' => AuditAction::class,
            'outcome' => AuditOutcome::class,
            'context' => 'array',
            'occurred_at' => 'immutable_datetime',
        ];
    }
}
