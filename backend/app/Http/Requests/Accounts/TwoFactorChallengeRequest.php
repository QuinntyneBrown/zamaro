<?php

namespace App\Http\Requests\Accounts;

use Illuminate\Foundation\Http\FormRequest;

class TwoFactorChallengeRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The 6 digits the authenticator app shows now. */
            'code' => ['required_without:recoveryCode', 'string', 'max:16'],
            /** One of the saved recovery codes, with or without the dash: "7kq4-m2xd". */
            'recoveryCode' => ['required_without:code', 'string', 'max:32'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required_without' => 'That code is wrong or has expired. Enter the code your app shows now.',
            'recoveryCode.required_without' => 'That recovery code is wrong or was used. Enter another of your saved codes.',
        ];
    }
}
