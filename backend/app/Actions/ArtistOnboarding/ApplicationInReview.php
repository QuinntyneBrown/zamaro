<?php

namespace App\Actions\ArtistOnboarding;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** The email already has an application in review (L2-047.3, 409). */
class ApplicationInReview extends HttpException
{
    public function __construct(public readonly string $email)
    {
        parent::__construct(409, 'You already have an application in review.');
    }
}
