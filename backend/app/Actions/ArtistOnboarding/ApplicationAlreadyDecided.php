<?php

namespace App\Actions\ArtistOnboarding;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** The application is no longer Submitted: it was approved or rejected, so nothing on it changes (409). */
class ApplicationAlreadyDecided extends HttpException
{
    public function __construct()
    {
        parent::__construct(409, 'This application was already decided.');
    }
}
