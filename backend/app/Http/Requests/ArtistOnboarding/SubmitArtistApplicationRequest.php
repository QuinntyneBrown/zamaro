<?php

namespace App\Http\Requests\ArtistOnboarding;

use App\Enums\ActType;
use App\Enums\Style;
use App\Enums\VideoStatus;
use App\Models\ArtistVideo;
use App\Rules\NorthAmericanPhone;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Everything an applicant sends (apply-as-artist, L2-047.1, L2-075). The bot check ran before this
 * (`bot-challenge:apply`); the `Idempotency-Key` header is checked here too, as `idempotencyKey`.
 */
class SubmitArtistApplicationRequest extends FormRequest
{
    public const BIO_MIN = 100;

    public const BIO_MAX = 1500;

    protected function prepareForValidation(): void
    {
        $this->merge(['idempotencyKey' => $this->header('Idempotency-Key')]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** The applicant's name, or the act's, as churches will see it. */
            'name' => ['required', 'string', 'min:2', 'max:100'],
            /** Where the confirmation and the decision go. */
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
            /** A town within 200 km of Toronto: "Scarborough". */
            'baseCity' => ['required', 'string', 'max:120'],
            /** @var 'solo'|'duo'|'band'|'choir' */
            'actType' => ['required', Rule::enum(ActType::class)],
            /** 1 to 4 of the style tags. */
            'styles' => ['required', 'array', 'min:1', 'max:4'],
            'styles.*' => ['string', 'distinct', Rule::enum(Style::class)],
            /** 100 to 1,500 characters. */
            'bio' => ['required', 'string', 'min:'.self::BIO_MIN, 'max:'.self::BIO_MAX],
            /** Whole dollars per service, $100 to $20,000. */
            'fromPrice' => ['required', 'integer', 'min:100', 'max:20000'],
            /** 20 to 200 km, in steps of 10. */
            'maxDriveKm' => ['required', 'integer', 'min:20', 'max:200', 'multiple_of:10'],
            /** The tokens of at least one uploaded video, in the order they should show. */
            'videos' => ['required', 'array', 'min:1', 'max:8'],
            'videos.*' => ['string', 'distinct', function (string $attribute, mixed $value, Closure $fail) {
                $video = is_string($value) ? ArtistVideo::where('upload_token', $value)->whereNull('artist_application_id')->first() : null;
                if ($video === null || ! in_array($video->status, [VideoStatus::Live, VideoStatus::Processing], true)) {
                    $fail('Upload at least one video, and wait for each one to finish.');
                }
            }],
            /** Exactly two church references. */
            'references' => ['required', 'array', 'size:2'],
            'references.*.name' => ['required', 'string', 'min:2', 'max:100'],
            'references.*.church' => ['required', 'string', 'min:2', 'max:120'],
            /** A phone number or an email address. */
            'references.*.contact' => ['required', 'string', 'max:254', function (string $attribute, mixed $value, Closure $fail) {
                if (! is_string($value) || (NorthAmericanPhone::toE164($value) === null && filter_var($value, FILTER_VALIDATE_EMAIL) === false)) {
                    $fail('Add a phone number or email so we can reach them.');
                }
            }],
            /** The bot challenge's token. */
            'challengeToken' => ['required', 'string'],
            /** The `Idempotency-Key` header: a UUID minted once per application, repeated on a retry. */
            'idempotencyKey' => ['required', 'uuid'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                // A reference is someone other than the applicant (L2-047.2), compared without case.
                $email = strtolower((string) $this->input('email'));
                foreach ((array) $this->input('references', []) as $index => $reference) {
                    $contact = is_array($reference) ? ($reference['contact'] ?? '') : '';
                    if ($email !== '' && is_string($contact) && strtolower(trim($contact)) === $email) {
                        $validator->errors()->add("references.{$index}.contact", 'References must be someone other than you.');
                    }
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter your name, or your act’s name.',
            'name.min' => 'Enter your name, or your act’s name.',
            'email.required' => 'Enter an email address like name@church.ca.',
            'email.email' => 'Enter an email address like name@church.ca.',
            'baseCity.required' => 'Enter the town you’re based in.',
            'actType.required' => 'Choose an act type.',
            'styles.required' => 'Pick 1 to 4 styles.',
            'styles.min' => 'Pick 1 to 4 styles.',
            'styles.max' => 'Pick 1 to 4 styles.',
            'bio.required' => 'Write a bio of 100 to 1,500 characters.',
            'bio.min' => 'Write a bio of 100 to 1,500 characters.',
            'bio.max' => 'Write a bio of 100 to 1,500 characters.',
            'fromPrice.required' => 'Enter a “from” price in whole dollars from $100 to $20,000.',
            'fromPrice.integer' => 'Enter a “from” price in whole dollars from $100 to $20,000.',
            'fromPrice.min' => 'Enter a “from” price in whole dollars from $100 to $20,000.',
            'fromPrice.max' => 'Enter a “from” price in whole dollars from $100 to $20,000.',
            'maxDriveKm.required' => 'Choose how far you’ll drive, from 20 to 200 km.',
            'maxDriveKm.min' => 'Choose how far you’ll drive, from 20 to 200 km.',
            'maxDriveKm.max' => 'Choose how far you’ll drive, from 20 to 200 km.',
            'maxDriveKm.multiple_of' => 'Choose how far you’ll drive, from 20 to 200 km.',
            'videos.required' => 'Upload at least one video, and wait for each one to finish.',
            'videos.min' => 'Upload at least one video, and wait for each one to finish.',
            'videos.max' => 'You can have up to 8 videos.',
            'references.required' => 'Name two church references.',
            'references.size' => 'Name two church references.',
            'references.*.name.required' => 'Enter the reference’s name.',
            'references.*.church.required' => 'Enter the reference’s church.',
            'references.*.contact.required' => 'Add a phone number or email so we can reach them.',
            'idempotencyKey.required' => 'Send an Idempotency-Key header: a UUID minted once per application.',
            'idempotencyKey.uuid' => 'Send an Idempotency-Key header: a UUID minted once per application.',
        ];
    }
}
