<?php

namespace App\Actions\ArtistProfiles;

use App\Enums\Style;
use App\Services\Discovery\SimilarArtists;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * No viewable artist has the address (L2-021): it never existed, or the artist is hidden. Rendered
 * as the `artist-not-found` problem; the profile adds the similar artists. It carries the hidden
 * artist's primary style and nothing else of theirs, so the body cannot tell the two cases apart.
 */
class ArtistNotFound extends NotFoundHttpException
{
    public function __construct(
        public readonly ?Style $primaryStyle = null,
        /** Null on the addresses that suggest nobody (the profile's sub-resources). */
        public readonly ?SimilarArtists $similarArtists = null,
    ) {
        parent::__construct('No artist has that address.');
    }

    public function withSimilarArtists(SimilarArtists $similarArtists): self
    {
        return new self($this->primaryStyle, $similarArtists);
    }
}
