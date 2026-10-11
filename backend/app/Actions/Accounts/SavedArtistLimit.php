<?php

namespace App\Actions\Accounts;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** A booker already has 200 saved artists; nothing was saved (422 `saved-artist-limit`). */
class SavedArtistLimit extends HttpException
{
    public function __construct()
    {
        parent::__construct(422, 'You can save up to 200 artists.');
    }
}
