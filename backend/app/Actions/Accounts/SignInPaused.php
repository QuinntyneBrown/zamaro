<?php

namespace App\Actions\Accounts;

use Carbon\CarbonImmutable;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Sign-in for this address is paused after 5 failures (429); `pausedUntil` is when it resumes. */
class SignInPaused extends HttpException
{
    public function __construct(public readonly CarbonImmutable $pausedUntil)
    {
        $seconds = max(1, (int) ceil(now()->diffInSeconds($pausedUntil)));
        parent::__construct(429, 'Sign-in for this address is paused.', headers: ['Retry-After' => (string) $seconds]);
    }
}
