<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChangeEmailRequest extends FormRequest
{
    public const WRONG_PASSWORD = 'That password isn’t right. Check it and try again.';

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The new address, different from the one the account signs in with. */
            'email' => ['required', 'string', 'email:rfc', 'max:254', 'regex:/@[^@\s]+\.[^@\s]+$/', Rule::notIn([$this->user()?->email])],
            /** The account's current password. */
            'currentPassword' => ['required', 'string', 'current_password:web'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Enter an email address like name@church.ca.',
            'email.email' => 'Enter an email address like name@church.ca.',
            'email.regex' => 'Enter an email address like name@church.ca.',
            'email.not_in' => 'That is the address you sign in with already.',
            'currentPassword.required' => self::WRONG_PASSWORD,
            'currentPassword.current_password' => self::WRONG_PASSWORD,
        ];
    }
}
