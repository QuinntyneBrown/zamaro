<?php

namespace App\Actions\ArtistOnboarding;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** A chunk arrived from somewhere other than the upload's current offset (409); the header says where it is. */
class UploadOffsetMismatch extends HttpException
{
    public function __construct(int $currentOffset)
    {
        parent::__construct(409, 'The chunk does not start where the upload ends.', headers: ['Upload-Offset' => (string) $currentOffset]);
    }
}
