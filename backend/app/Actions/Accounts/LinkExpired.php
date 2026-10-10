<?php

namespace App\Actions\Accounts;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** An emailed link that was used, has run out or never existed; the page offers a new one (410). */
class LinkExpired extends HttpException
{
    public function __construct()
    {
        parent::__construct(410, 'The link was used, has expired or is unknown.');
    }
}
