<?php

namespace App\Http\Requests\Accounts;

use App\Rules\PasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The account's current password. */
            'currentPassword' => ['required', 'string', 'current_password:web'],
            /** 12 to 128 characters, not in a known data breach. */
            'password' => ['required', 'string', new PasswordPolicy],
            /** The new password typed again. */
            'passwordConfirmation' => ['required', 'string', 'same:password'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'currentPassword.required' => ChangeEmailRequest::WRONG_PASSWORD,
            'currentPassword.current_password' => ChangeEmailRequest::WRONG_PASSWORD,
            'passwordConfirmation.same' => 'The two passwords don’t match. Type the new one again.',
        ];
    }
}
