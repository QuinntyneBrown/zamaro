<?php

namespace App\Http\Requests\UserExperience;

use App\Enums\ThemePreference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePreferencesRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** `light` or `dark`; null follows each device's own choice again. */
            'themePreference' => ['present', 'nullable', Rule::enum(ThemePreference::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['themePreference.enum' => 'Choose light or dark.', 'themePreference.present' => 'Choose light or dark.'];
    }
}
