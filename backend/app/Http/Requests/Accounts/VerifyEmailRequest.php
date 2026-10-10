<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;

class VerifyEmailRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The token from the emailed link's `token` parameter. */
            'token' => ['required', 'string', 'max:128'],
        ];
    }
}
