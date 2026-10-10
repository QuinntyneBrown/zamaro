<?php

namespace App\Http\Requests\Discovery;

use Illuminate\Foundation\Http\FormRequest;

class LookUpPlaceRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** A town or address, e.g. "Burlington, ON". */
            'q' => ['required', 'string', 'max:200'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['q.required' => 'Enter your church’s address or town, or pick a city below.'];
    }
}
