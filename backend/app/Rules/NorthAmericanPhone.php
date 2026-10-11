<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * A North American (NANP) phone number (L2-024.1, L2-025.4): ten digits, with or without a leading 1
 * and any spaces, dots, dashes or brackets, whose area code and exchange do not start with 0 or 1.
 * Stored in E.164 and shown as "905-555-0123".
 */
class NorthAmericanPhone implements ValidationRule
{
    public const MESSAGE = 'Enter a North American phone number, like 905-555-0123.';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || self::digits($value) === null) {
            $fail(self::MESSAGE);
        }
    }

    /** "+19055550123", or null when the value is not a North American number. */
    public static function toE164(string $value): ?string
    {
        $digits = self::digits($value);

        return $digits === null ? null : '+1'.$digits;
    }

    /** "905-555-0123" from a stored E.164 number. */
    public static function format(string $e164): string
    {
        $digits = substr(preg_replace('/\D/', '', $e164), -10);

        return substr($digits, 0, 3).'-'.substr($digits, 3, 3).'-'.substr($digits, 6);
    }

    /** The ten national digits, or null. */
    private static function digits(string $value): ?string
    {
        if (preg_match('/[^\d\s().+\-]/', $value)) {
            return null;
        }
        $digits = preg_replace('/\D/', '', $value);
        if (strlen($digits) === 11 && $digits[0] === '1') {
            $digits = substr($digits, 1);
        }

        return preg_match('/^[2-9]\d{2}[2-9]\d{6}$/', $digits) ? $digits : null;
    }
}
