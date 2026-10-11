<?php

namespace App\Http\Requests\Accounts;

use App\Rules\PasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The token from the emailed link, `/reset-password/{token}`. */
            'token' => ['required', 'string', 'max:128'],
            /** 12 to 128 characters, not in a known data breach. */
            'password' => ['required', 'string', new PasswordPolicy],
            /** The new password typed again. */
            'passwordConfirmation' => ['required', 'string', 'same:password'],
        ];
    }
}
