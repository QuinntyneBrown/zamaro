<?php

namespace App\Http\Requests\Accounts;

use App\Rules\NorthAmericanPhone;
use Illuminate\Foundation\Http\FormRequest;

/** The church form (L2-024.1): checked before the address is looked up. */
class SaveChurchRequest extends FormRequest
{
    public const POSTAL_CODE = '/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/';

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** 2 to 120 characters. */
            'name' => ['required', 'string', 'between:2,120'],
            'streetAddress' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            /** A Canadian postal code: "L7R 1A3", with or without the space, in any case. */
            'postalCode' => ['required', 'string', 'regex:'.self::POSTAL_CODE],
            /** A North American number, in any common format: "905-555-0123". */
            'phone' => ['required', 'string', new NorthAmericanPhone],
            'denomination' => ['nullable', 'string', 'max:120'],
            /** A whole number of people above 0. */
            'typicalAttendance' => ['nullable', 'integer', 'between:1,100000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Use 2 to 120 characters for the church name.',
            'name.between' => 'Use 2 to 120 characters for the church name.',
            'streetAddress.required' => 'Enter the street address.',
            'city.required' => 'Enter the city.',
            'postalCode.required' => 'Enter a postal code like L7R 1A3, with six characters.',
            'postalCode.regex' => 'Enter a postal code like L7R 1A3, with six characters.',
            'phone.required' => NorthAmericanPhone::MESSAGE,
            'typicalAttendance.integer' => 'Enter the typical attendance as a whole number above 0.',
            'typicalAttendance.between' => 'Enter the typical attendance as a whole number above 0.',
        ];
    }
}
