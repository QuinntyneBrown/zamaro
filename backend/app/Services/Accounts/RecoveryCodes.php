<?php

namespace App\Services\Accounts;

use App\Models\RecoveryCode;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Ten single-use codes for signing in without the phone (L2-072.3): "7kq4-m2xd". New codes replace
 * every earlier one; only their SHA-256 is stored, and each works once.
 */
class RecoveryCodes
{
    public const COUNT = 10;

    private const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

    /** @return list<string> the new codes, shown once */
    public function replace(User $user): array
    {
        RecoveryCode::where('user_id', $user->id)->delete();
        $codes = [];
        while (count($codes) < self::COUNT) {
            $code = $this->code();
            $codes[$code] = $code;
        }
        foreach ($codes as $code) {
            RecoveryCode::create(['user_id' => $user->id, 'code_hash' => self::hash($code)]);
        }

        return array_values($codes);
    }

    /** Uses up one unused code; false when it is unknown or was used. */
    public function use(User $user, string $code): bool
    {
        return RecoveryCode::where('user_id', $user->id)
            ->where('code_hash', self::hash($code))
            ->whereNull('used_at')
            ->update(['used_at' => now()->toIso8601String()]) === 1;
    }

    /** "7KQ4M2XD", "7kq4-m2xd" and " 7kq4 m2xd " are the same code. */
    private static function hash(string $code): string
    {
        $clean = Str::lower(preg_replace('/[^a-zA-Z0-9]/', '', $code));

        return hash('sha256', substr($clean, 0, 4).'-'.substr($clean, 4));
    }

    private function code(): string
    {
        $characters = '';
        for ($i = 0; $i < 8; $i++) {
            $characters .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
        }

        return substr($characters, 0, 4).'-'.substr($characters, 4);
    }
}
