<?php

namespace App\Actions\Accounts;

use Carbon\CarbonInterface;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * An emailed link that was used, has run out or never existed; the page offers a new one (410). A
 * reset link that existed names its account and when it was sent, as the expired page says.
 */
class LinkExpired extends HttpException
{
    public function __construct(private readonly ?string $email = null, private readonly ?CarbonInterface $sentAt = null)
    {
        parent::__construct(410, 'The link was used, has expired or is unknown.');
    }

    /** @return array<string, string> */
    public function extensions(): array
    {
        return $this->email === null || $this->sentAt === null ? [] : [
            'email' => $this->email,
            'sentAt' => $this->sentAt->setTimezone(config('app.timezone'))->toIso8601String(),
        ];
    }
}
