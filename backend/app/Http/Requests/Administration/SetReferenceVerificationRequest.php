<?php

namespace App\Http\Requests\Administration;

use Illuminate\Foundation\Http\FormRequest;

/** The tick on a church reference (review-artist-application). */
class SetReferenceVerificationRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** True once the administrator has reached the reference and they vouch for the applicant. */
            'verified' => ['required', 'boolean'],
        ];
    }
}
