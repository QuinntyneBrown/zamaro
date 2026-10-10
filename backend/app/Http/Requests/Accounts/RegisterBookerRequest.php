<?php

namespace App\Http\Requests\Accounts;

use App\Rules\PasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;

class RegisterBookerRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            /** Written in lower case; an address in any case that already has an account gets the same answer. */
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
            /** 12 to 128 characters, not in a known data breach. */
            'password' => ['required', 'string', new PasswordPolicy],
            /** The terms of use and privacy policy box; must be ticked. */
            'acceptedTerms' => ['accepted'],
            /** The separate "Email me about new artists near my church" box; unticked unless the person ticks it. */
            'marketingOptIn' => ['sometimes', 'boolean'],
            /** The terms version the form showed (`GET /legal-documents/current`); 409 when it is no longer current. */
            'termsVersion' => ['required', 'string', 'size:7'],
            /** The privacy policy version the form showed; 409 when it is no longer current. */
            'privacyPolicyVersion' => ['required', 'string', 'size:7'],
            /** The bot challenge provider's single-use token, checked before anything else. */
            'challengeToken' => ['required', 'string', 'max:2048'],
            /** Where the verification link returns to: a path on the site. Anything else returns to Discover. */
            'returnUrl' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
