<?php

namespace App\Actions\Privacy;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** The person has not accepted the current terms; nothing else answers until they do (409). */
class TermsAcceptanceRequired extends HttpException
{
    public function __construct()
    {
        parent::__construct(409, 'Accept the current terms first.');
    }
}
