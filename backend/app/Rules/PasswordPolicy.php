<?php

namespace App\Rules;

use App\Contracts\BreachedPasswordChecker;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;

/**
 * L2-072.1: a new password is 12 to 128 characters and not in a known data breach, or it is refused
 * with the reason (accounts/sign-in-and-recover-access).
 */
class PasswordPolicy implements ValidationRule
{
    public const MIN = 12;

    public const MAX = 128;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('Enter a password.');

            return;
        }

        $length = Str::length($value);
        if ($length < self::MIN) {
            $fail("This one has {$length} characters. Use at least ".self::MIN.'.');
        } elseif ($length > self::MAX) {
            $fail("This one has {$length} characters. Use at most ".self::MAX.'.');
        } elseif (app(BreachedPasswordChecker::class)->isBreached($value)) {
            $fail('This password appears in a known data breach. Choose another.');
        }
    }
}
