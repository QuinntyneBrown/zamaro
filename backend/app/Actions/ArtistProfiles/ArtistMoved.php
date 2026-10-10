<?php

namespace App\Actions\ArtistProfiles;

use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * The address is one of a viewable artist's retired slugs (L2-021.3, L2-055.3). Rendered as a 301 to
 * the same route under the current slug, with the query string kept.
 */
class ArtistMoved extends HttpException
{
    public function __construct(public readonly string $currentSlug)
    {
        parent::__construct(301, 'The artist has a new address.');
    }
}
