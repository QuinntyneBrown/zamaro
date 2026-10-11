<?php

namespace App\Http\Requests\Privacy;

use Illuminate\Foundation\Http\FormRequest;

class AcceptTermsRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The terms version the page showed: "2026-10". */
            'termsVersion' => ['required', 'string', 'max:32'],
        ];
    }
}
