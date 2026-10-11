<?php

namespace App\Http\Requests\Accounts;

use App\Actions\Accounts\ManageTwoFactor;
use Illuminate\Foundation\Http\FormRequest;

class TwoFactorProofRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The 6 digits the app shows now, or one unused recovery code like "7kq4-m2xd". */
            'code' => ['required', 'string', 'max:32'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['code.required' => ManageTwoFactor::WRONG];
    }
}
