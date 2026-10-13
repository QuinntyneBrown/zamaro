<?php

namespace App\Actions\Accounts;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** An administrator asked to turn two-step sign-in off; their role requires it (409, L2-066.2). */
class TwoFactorRequired extends HttpException
{
    public function __construct()
    {
        parent::__construct(409, 'Administrators keep two-step sign-in on.');
    }
}
