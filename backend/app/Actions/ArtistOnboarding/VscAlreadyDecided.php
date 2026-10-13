<?php

namespace App\Actions\ArtistOnboarding;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** The check is no longer waiting: another administrator verified it, or it was blocked (409). */
class VscAlreadyDecided extends HttpException
{
    public function __construct()
    {
        parent::__construct(409, 'This check was already decided.');
    }
}
