<?php

namespace App\Actions\Privacy;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** A form showed a terms or privacy policy version that is no longer current; nothing was written (409). */
class LegalDocumentOutdated extends HttpException
{
    public function __construct()
    {
        parent::__construct(409, 'The terms or privacy policy changed since the form was shown.');
    }
}
