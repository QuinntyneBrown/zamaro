<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

/** An application was written and committed (apply-as-artist); the confirmation email follows. */
class ArtistApplicationSubmitted
{
    use Dispatchable;

    public function __construct(public readonly int $applicationId) {}
}
