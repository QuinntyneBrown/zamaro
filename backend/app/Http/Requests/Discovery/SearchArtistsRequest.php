<?php

namespace App\Http\Requests\Discovery;

use App\Enums\GatheringKind;
use App\Enums\SearchSort;
use App\Enums\Style;
use App\Services\Discovery\Coordinates;
use App\Services\Discovery\LineupFilter;
use App\Services\Discovery\SearchCriteria;
use App\Services\Discovery\ServiceArea;
use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The Discover search (L2-004). Errors are keyed by the form's fields: `date`, `kind`, `location`
 * (from `lat` and `lng`) and `radius`, with the copy the form shows.
 */
class SearchArtistsRequest extends FormRequest
{
    public const RADII_KM = [40, 80, 120, 200];

    public const UNDER_800 = 'under-800';

    private const TIME_ZONE = 'America/Toronto';

    private const LOCATION_MISSING = 'Enter your church’s address or town, or pick a city below.';

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $today = CarbonImmutable::now(self::TIME_ZONE)->startOfDay();

        return [
            /** Event date, `YYYY-MM-DD`, from 3 days to 18 months ahead in Toronto time. */
            'date' => [
                'bail', 'required', 'date_format:Y-m-d',
                'after_or_equal:'.$today->addDays(3)->toDateString(),
                'before_or_equal:'.$today->addMonthsNoOverflow(18)->toDateString(),
            ],
            'kind' => ['required', Rule::enum(GatheringKind::class)],
            /** Event location latitude; errors are reported under `location`. */
            'lat' => ['required', 'numeric', 'between:-90,90'],
            /** Event location longitude; errors are reported under `location`. */
            'lng' => ['required', 'numeric', 'between:-180,180'],
            /** Driving radius in kilometres. */
            'radius' => ['required', 'integer', Rule::in(self::RADII_KM)],
            /** How the tickets are ordered; Closest first by default. */
            'sort' => ['nullable', Rule::enum(SearchSort::class)],
            /** Comma-separated style slugs, any of which matches, e.g. `band,gospel-choir`. */
            'styles' => ['nullable', 'string', function (string $attribute, string $value, Closure $fail) {
                if (collect(explode(',', $value))->contains(fn (string $style) => Style::tryFrom($style) === null)) {
                    $fail('Pick styles from the chips.');
                }
            }],
            /** `under-800`: only artists whose From price is below $800. */
            'price' => ['nullable', 'string', Rule::in([self::UNDER_800])],
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

    /**
     * The form has one location field, so coordinate errors are reported there.
     *
     * @return list<callable>
     */
    public function after(ServiceArea $serviceArea): array
    {
        return [function (Validator $validator) use ($serviceArea) {
            $errors = $validator->errors();
            if ($errors->hasAny(['lat', 'lng'])) {
                $errors->forget('lat');
                $errors->forget('lng');
                $errors->add('location', self::LOCATION_MISSING);

                return;
            }
            if (! $serviceArea->contains($this->location())) {
                $validator->errors()->add('location', 'Zamaro serves churches within 200 km of Toronto.');
            }
        }];
    }

    public function criteria(): SearchCriteria
    {
        return new SearchCriteria(
            CarbonImmutable::createFromFormat('Y-m-d', $this->validated('date'), self::TIME_ZONE)->startOfDay(),
            GatheringKind::from($this->validated('kind')),
            $this->location(),
            (int) $this->validated('radius'),
            SearchSort::tryFrom((string) $this->validated('sort')) ?? SearchSort::Closest,
            new LineupFilter($this->styles(), $this->validated('price') === self::UNDER_800),
        );
    }

    /**
     * @return list<Style>
     */
    public function styles(): array
    {
        $styles = (string) $this->validated('styles');

        return $styles === '' ? [] : array_map(fn (string $style) => Style::from($style), explode(',', $styles));
    }

    private function location(): Coordinates
    {
        return new Coordinates((float) $this->query('lat'), (float) $this->query('lng'));
    }
}
