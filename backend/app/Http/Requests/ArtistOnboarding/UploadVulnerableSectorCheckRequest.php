<?php

namespace App\Http\Requests\ArtistOnboarding;

use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/** The check's file and issue date (verify-vulnerable-sector-check, M3 D11 copy). */
class UploadVulnerableSectorCheckRequest extends FormRequest
{
    public const MAX_BYTES = 10 * 1024 * 1024;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The scan of the whole check: a PDF, JPEG or PNG up to 10 MB, typed by its content. */
            'file' => ['required', 'file', function (string $attribute, mixed $value, Closure $fail) {
                if ($value instanceof UploadedFile && $value->getSize() > self::MAX_BYTES) {
                    $fail('This file is '.number_format($value->getSize() / 1_048_576).' MB. Choose a PDF, JPEG or PNG up to 10 MB.');
                }
            }],
            /** `YYYY-MM-DD`, printed on the check; today at the latest. */
            'issuedOn' => ['required', 'date_format:Y-m-d', function (string $attribute, mixed $value, Closure $fail) {
                if (is_string($value) && CarbonImmutable::parse($value, config('app.timezone'))->isAfter(today())) {
                    $fail('The issue date can’t be after today.');
                }
            }],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Choose the scan of your check.',
            'file.file' => 'Choose the scan of your check.',
            'issuedOn.required' => 'Enter the issue date printed on the check.',
            'issuedOn.date_format' => 'Enter the issue date printed on the check.',
        ];
    }

    public function issuedOn(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->validated('issuedOn'), config('app.timezone'));
    }
}
