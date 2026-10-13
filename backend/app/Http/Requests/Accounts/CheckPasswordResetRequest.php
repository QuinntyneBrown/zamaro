<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;

class CheckPasswordResetRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The token from the emailed link, `/reset-password/{token}`. */
            'token' => ['required', 'string', 'max:128'],
        ];
    }
}
