<?php

namespace App\Http\Requests\Privacy;

use Illuminate\Foundation\Http\FormRequest;

class MarketingChoiceRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** Email me about new artists near my church. */
            'granted' => ['required', 'boolean'],
        ];
    }
}
