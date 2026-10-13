<?php

namespace App\Actions\ArtistOnboarding;

use App\Enums\ApplicationStatus;
use App\Events\ArtistApplicationSubmitted;
use App\Models\ApplicationReference;
use App\Models\ArtistApplication;
use App\Models\ArtistVideo;
use App\Models\User;
use App\Rules\NorthAmericanPhone;
use App\Services\Discovery\ServiceArea;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * A guest's application (apply-as-artist, L2-047): the same `Idempotency-Key` answers the application
 * it already created, before any other check; otherwise a second pending application for the email
 * is refused, the base city is located inside the service area, and the application, its references
 * and its videos are written in one transaction. `ArtistApplicationSubmitted` fires after commit.
 */
class SubmitArtistApplication
{
    /** The cast's applications are A-0217 to A-0219; a fresh database starts there too. */
    public const FIRST_NUMBER = 217;

    public function __construct(private readonly ServiceArea $serviceArea) {}

    /**
     * @param  array<string, mixed>  $data  the validated request
     * @return array{application: ArtistApplication, created: bool}
     *
     * @throws ApplicationInReview when the email already has a pending application
     * @throws ValidationException on `baseCity` when it cannot be found or is outside the area
     */
    public function handle(array $data, string $idempotencyKey, ?User $applicant): array
    {
        $repeat = ArtistApplication::where('idempotency_key', $idempotencyKey)->first();
        if ($repeat !== null) {
            return ['application' => $repeat, 'created' => false];
        }

        $email = Str::lower(trim($data['email']));
        if (ArtistApplication::whereRaw('lower(email) = ?', [$email])->where('status', ApplicationStatus::Submitted)->exists()) {
            throw new ApplicationInReview($email);
        }
        $place = $this->serviceArea->locate(Str::squish($data['baseCity']), 'baseCity');

        $application = DB::transaction(function () use ($data, $idempotencyKey, $applicant, $email, $place): ArtistApplication {
            // Numbers never skip: the next is one past the last, read under a transaction-wide lock.
            DB::statement("select pg_advisory_xact_lock(hashtext('artist_applications.number'))");
            $last = (int) substr((string) ArtistApplication::max('number'), 2);
            $application = ArtistApplication::create([
                'user_id' => $applicant?->id,
                'number' => sprintf('A-%04d', max($last, self::FIRST_NUMBER - 1) + 1),
                'name' => Str::squish($data['name']),
                'email' => $email,
                'act_type' => $data['actType'],
                'base_city' => $place->city,
                'base_latitude' => $place->point->latitude,
                'base_longitude' => $place->point->longitude,
                'styles' => array_values($data['styles']),
                'bio' => trim($data['bio']),
                'from_price_cents' => (int) $data['fromPrice'] * 100,
                'max_drive_km' => (int) $data['maxDriveKm'],
                'status' => ApplicationStatus::Submitted,
                'idempotency_key' => $idempotencyKey,
                'submitted_at' => now()->utc(),
            ]);
            foreach ($data['references'] as $reference) {
                $contact = trim($reference['contact']);
                $phone = NorthAmericanPhone::toE164($contact);
                ApplicationReference::create([
                    'artist_application_id' => $application->id,
                    'name' => Str::squish($reference['name']),
                    'church' => Str::squish($reference['church']),
                    'phone' => $phone,
                    'email' => $phone === null ? Str::lower($contact) : null,
                ]);
            }
            foreach (array_values($data['videos']) as $index => $token) {
                ArtistVideo::where('upload_token', $token)->whereNull('artist_application_id')
                    ->update(['artist_application_id' => $application->id, 'position' => $index + 1, 'updated_at' => now()]);
            }

            return $application;
        });
        ArtistApplicationSubmitted::dispatch($application->id);

        return ['application' => $application, 'created' => true];
    }
}
