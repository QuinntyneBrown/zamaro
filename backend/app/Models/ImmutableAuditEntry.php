<?php

namespace App\Models;

use LogicException;

/** An audit entry is never changed or deleted by the application (L2-069.2). */
class ImmutableAuditEntry extends LogicException
{
    public static function refuse(string $operation): self
    {
        return new self("Audit entries are append-only; {$operation} is refused.");
    }
}
