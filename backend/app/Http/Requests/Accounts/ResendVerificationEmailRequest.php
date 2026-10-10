<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;

class ResendVerificationEmailRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** A guest's expired link: the new one goes to its owner. Ignored when signed in. */
            'token' => ['nullable', 'string', 'max:128'],
            /** A guest who has just signed up: the address they typed. Ignored when signed in or with `token`. */
            'email' => ['nullable', 'string', 'email:rfc', 'max:254'],
            /** Where the new link returns to: a path on the site. Anything else returns to Discover. */
            'returnUrl' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
