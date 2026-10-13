<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

/** An application was rejected and committed (review-artist-application); the reason and note are emailed. */
class ArtistApplicationRejected
{
    use Dispatchable;

    public function __construct(public readonly int $applicationId) {}
}
