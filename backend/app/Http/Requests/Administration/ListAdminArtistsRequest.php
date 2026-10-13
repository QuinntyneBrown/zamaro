<?php

namespace App\Http\Requests\Administration;

use Illuminate\Foundation\Http\FormRequest;

/** The Artists list's search (pages/admin-artists). */
class ListAdminArtistsRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** Part of a name, base city or account email, any case. */
            'q' => ['nullable', 'string', 'max:100'],
        ];
    }
}
