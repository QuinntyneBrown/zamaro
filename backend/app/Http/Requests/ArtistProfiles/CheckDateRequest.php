<?php

namespace App\Http\Requests\ArtistProfiles;

use App\Services\ArtistAvailability\BookingWindow;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

/** The booking stub's date (L2-019), with the copy the stub shows under its date field. */
class CheckDateRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** Event date, `YYYY-MM-DD`, from 3 days to 18 months ahead in Toronto time. */
            'date' => [
                'bail', 'required', 'date_format:Y-m-d',
                'after_or_equal:'.BookingWindow::earliest()->toDateString(),
                'before_or_equal:'.BookingWindow::latest()->toDateString(),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'date.required' => 'Pick your event date.',
            'date.after_or_equal' => 'Pick a date at least 3 days away.',
            'date.before_or_equal' => 'We take bookings up to 18 months ahead.',
        ];
    }

    public function eventDate(): CarbonImmutable
    {
        return BookingWindow::date($this->validated('date'));
    }
}
