<?php

namespace App\Http\Requests\Discovery;

use App\Enums\GatheringKind;
use App\Services\Discovery\Coordinates;
use App\Services\Discovery\SearchCriteria;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SearchArtistsRequest extends FormRequest
{
    public const RADII_KM = [40, 80, 120, 200];

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** Event date, `YYYY-MM-DD`. */
            'date' => ['required', 'date_format:Y-m-d'],
            'kind' => ['required', Rule::enum(GatheringKind::class)],
            /** Event location latitude. */
            'lat' => ['required', 'numeric', 'between:-90,90'],
            /** Event location longitude. */
            'lng' => ['required', 'numeric', 'between:-180,180'],
            /** Driving radius in kilometres. */
            'radius' => ['required', 'integer', Rule::in(self::RADII_KM)],
        ];
    }

    public function criteria(): SearchCriteria
    {
        return new SearchCriteria(
            CarbonImmutable::createFromFormat('Y-m-d', $this->validated('date'), 'America/Toronto')->startOfDay(),
            GatheringKind::from($this->validated('kind')),
            new Coordinates((float) $this->validated('lat'), (float) $this->validated('lng')),
            (int) $this->validated('radius'),
        );
    }
}
