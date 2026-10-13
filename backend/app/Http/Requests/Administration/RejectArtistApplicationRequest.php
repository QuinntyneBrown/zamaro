<?php

namespace App\Http\Requests\Administration;

use App\Enums\ApplicationRejectionReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** The rejection dialog (dialogs/reject-application): a reason from the list and an optional note. */
class RejectArtistApplicationRequest extends FormRequest
{
    public const NOTE_MAX = 1000;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** @var 'references-unconfirmed'|'videos-not-worship'|'outside-service-area'|'incomplete-or-inaccurate'|'other' */
            'reason' => ['required', Rule::enum(ApplicationRejectionReason::class)],
            /** Sent with the reason; up to 1,000 characters. */
            'note' => ['nullable', 'string', 'max:'.self::NOTE_MAX],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'reason.required' => 'Choose a reason from the list.',
            'reason.Illuminate\Validation\Rules\Enum' => 'Choose a reason from the list.',
            'reason.enum' => 'Choose a reason from the list.',
            'note.max' => 'Keep your note to 1,000 characters.',
        ];
    }
}
