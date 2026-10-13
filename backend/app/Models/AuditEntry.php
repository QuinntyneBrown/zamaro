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

    /** No operation in the application changes or deletes an entry (L2-069.2); only audit:prune deletes, in SQL. */
    protected static function booted(): void
    {
        static::updating(fn () => throw ImmutableAuditEntry::refuse('update'));
        static::deleting(fn () => throw ImmutableAuditEntry::refuse('delete'));
    }

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
