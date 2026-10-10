<?php

namespace App\Logging;

use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

/**
 * Replaces secrets in a log record's context and extra data before any handler writes it (L2-079.3,
 * security/protect-secrets-and-data). Keys match in any case and at any depth.
 */
class RedactSensitiveData implements ProcessorInterface
{
    public const PLACEHOLDER = '[REDACTED]';

    /** Keys whose values never reach a log, lower-cased. Any key ending in `_token` is one too. */
    private const REDACTED_KEYS = [
        'password', 'password_confirmation', 'current_password', 'token', 'challengetoken',
        'authorization', 'cookie', 'set-cookie', 'x-xsrf-token', 'session_id', 'recovery_codes', 'body',
    ];

    /** Payment identifiers that keep their last 4 characters. */
    private const LAST_FOUR_KEYS = ['processor_payment_id', 'payment_method_id'];

    /** 12 to 19 digits, optionally grouped by spaces or hyphens, standing alone (not part of a UUID). */
    private const CARD_NUMBER = '/(?<![\w-])\d(?:[ -]?\d){11,18}(?![\w-])/';

    public function __invoke(LogRecord $record): LogRecord
    {
        return $record->with(context: $this->redact($record->context), extra: $this->redact($record->extra));
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @return array<array-key, mixed>
     */
    private function redact(array $data): array
    {
        foreach ($data as $key => $value) {
            $name = strtolower((string) $key);
            $data[$key] = match (true) {
                in_array($name, self::REDACTED_KEYS, true), str_ends_with($name, '_token') => self::PLACEHOLDER,
                in_array($name, self::LAST_FOUR_KEYS, true) && is_scalar($value) => $this->lastFour((string) $value),
                is_array($value) => $this->redact($value),
                is_string($value) => $this->maskCardNumbers($value),
                default => $value,
            };
        }

        return $data;
    }

    /** Digit runs that pass the Luhn check are card numbers; order numbers and the like are left alone. */
    private function maskCardNumbers(string $value): string
    {
        return preg_replace_callback(self::CARD_NUMBER, function (array $match) {
            $digits = preg_replace('/\D/', '', $match[0]);

            return $this->passesLuhn($digits) ? $this->lastFour($digits) : $match[0];
        }, $value);
    }

    private function passesLuhn(string $digits): bool
    {
        $sum = 0;
        foreach (str_split(strrev($digits)) as $i => $digit) {
            $n = (int) $digit * ($i % 2 === 1 ? 2 : 1);
            $sum += $n > 9 ? $n - 9 : $n;
        }

        return $sum % 10 === 0;
    }

    private function lastFour(string $value): string
    {
        return '…'.substr($value, -4);
    }
}
