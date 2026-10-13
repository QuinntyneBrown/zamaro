<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The address the person signs in with; the answer is the same whether or not it has an account. */
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
            /** The bot challenge provider's single-use token, checked before anything else. */
            'challengeToken' => ['required', 'string', 'max:2048'],
        ];
    }
}
