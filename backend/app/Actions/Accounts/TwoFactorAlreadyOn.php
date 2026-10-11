<?php

namespace App\Actions\Accounts;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** Two-step sign-in is already on; turning it on again would replace a working key (409). */
class TwoFactorAlreadyOn extends HttpException
{
    public function __construct()
    {
        parent::__construct(409, 'Two-step sign-in is already on.');
    }
}
