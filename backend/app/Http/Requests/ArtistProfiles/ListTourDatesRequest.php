<?php

namespace App\Http\Requests\ArtistProfiles;

use App\Services\ArtistAvailability\BookingWindow;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class ListTourDatesRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The search date, `YYYY-MM-DD`; the list starts 3 days from today without one. */
            'from' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    public function from(): ?CarbonImmutable
    {
        $from = $this->validated('from');

        return $from === null ? null : BookingWindow::date($from);
    }
}
