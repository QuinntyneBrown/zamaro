<?php

namespace App\Http\Requests\Accounts;

use App\Rules\NorthAmericanPhone;
use Illuminate\Foundation\Http\FormRequest;

class UpdateContactPhoneRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** A North American number, in any common format: "905-555-0148". */
            'contactPhone' => ['required', 'string', new NorthAmericanPhone],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['contactPhone.required' => NorthAmericanPhone::MESSAGE];
    }
}
