<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;

class SignInRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The address the account signs in with, in any case. */
            'email' => ['required', 'string', 'max:254'],
            'password' => ['required', 'string', 'max:1024'],
        ];
    }
}
