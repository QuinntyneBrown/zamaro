<?php

namespace Tests\Feature\ArtistOnboarding;

use App\Actions\ArtistOnboarding\StartApplicationVideoUpload;
use App\Enums\ApplicationStatus;
use App\Enums\VideoStatus;
use App\Models\ApplicationReference;
use App\Models\ArtistApplication;
use App\Models\ArtistVideo;
use App\Notifications\ApplicationReceivedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-047.1, L2-047.4, L2-063, L2-077.4 (apply-as-artist): a guest sends an application with videos
 * and two references and gets its number and a reply-by date 3 business days on, skipping weekends
 * and Ontario's statutory holidays; the confirmation is emailed; the answer never carries a
 * reference's phone or email.
 */
class SubmitArtistApplicationTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const APPLICATIONS = '/api/v1/artist-applications';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        Notification::fake();
    }

    public function test_a_guest_sends_an_application_and_gets_its_number_reply_by_date_and_confirmation(): void
    {
        $video = $this->liveVideo('Way Maker, live at Cornerstone');

        $response = $this->submit($this->tobi(['videos' => [$video->upload_token]]), $key = (string) Str::uuid());

        $response->assertCreated()
            ->assertJsonPath('data.number', 'A-0217')
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.name', 'Tobi Adeyemi')
            ->assertJsonPath('data.email', 'tobi@tobiadeyemi.ca')
            ->assertJsonPath('data.submittedAt', '2026-10-09T10:00:00-04:00')
            ->assertJsonPath('data.replyBy', '2026-10-15')
            ->assertJsonPath('data.skippedHolidays', [['date' => '2026-10-12', 'name' => 'Thanksgiving']])
            ->assertJsonPath('data.videos.0.title', 'Way Maker, live at Cornerstone')
            ->assertJsonPath('data.references.0.name', 'Pastor Samuel Osei')
            ->assertJsonPath('data.references.0.church', 'Cornerstone Baptist, Scarborough')
            ->assertJsonPath('data.references.1.name', 'Ruth Kim');
        $this->assertMatchesContract($response);
        // Reference contacts stay private (L2-079): neither the email nor the phone is in the answer.
        $this->assertStringNotContainsString('samuel.osei@cornerstonebaptist.ca', $response->getContent());
        $this->assertStringNotContainsString('647', $response->getContent());

        $application = ArtistApplication::where('email', 'tobi@tobiadeyemi.ca')->sole();
        $this->assertSame(ApplicationStatus::Submitted, $application->status);
        $this->assertSame($key, $application->idempotency_key);
        $this->assertSame('Scarborough', $application->base_city);
        $this->assertEqualsWithDelta(43.77, (float) $application->base_latitude, 0.1);
        $this->assertSame(['solo-vocalist', 'acoustic', 'hymns'], $application->styles);
        $this->assertSame(40000, $application->from_price_cents);
        $this->assertSame(80, $application->max_drive_km);
        $this->assertNull($application->user_id);

        $references = ApplicationReference::where('artist_application_id', $application->id)->orderBy('id')->get();
        $this->assertSame('samuel.osei@cornerstonebaptist.ca', $references[0]->email);
        $this->assertNull($references[0]->phone);
        $this->assertSame('+16475550192', $references[1]->phone);
        $this->assertNull($references[1]->email);
        // Encrypted at rest (L2-079.2): the raw column is not the address.
        $raw = DB::table('application_references')->where('id', $references[0]->id)->value('email');
        $this->assertNotSame('samuel.osei@cornerstonebaptist.ca', $raw);

        $video->refresh();
        $this->assertSame($application->id, $video->artist_application_id);
        $this->assertSame(1, $video->position);

        Notification::assertSentOnDemand(ApplicationReceivedNotification::class, function (ApplicationReceivedNotification $notification, array $channels, AnonymousNotifiable $notifiable) {
            $this->assertSame('tobi@tobiadeyemi.ca', $notifiable->routes['mail']);
            $mail = $notification->toMail($notifiable);
            $this->assertSame('We received your application, A-0217', $mail->subject);
            $html = $mail->render()->toHtml();
            $this->assertStringContainsString('Hi Tobi,', $html);
            $this->assertStringContainsString('Thu 15 Oct', $html);

            return true;
        });
    }

    public function test_the_reply_by_date_is_three_business_days_on_skipping_weekends_and_ontario_holidays(): void
    {
        // Wed 7 Oct: Thu, Fri, then Tue 13 (Mon 12 Oct is Thanksgiving).
        $this->travelTo(Carbon::parse('2026-10-07 16:00', 'America/Toronto'));
        $this->submit($this->tobi(['email' => 'wed@example.ca']), (string) Str::uuid())->assertCreated()->assertJsonPath('data.replyBy', '2026-10-13');

        // Thu 24 Dec: Christmas and Boxing Day (observed Mon 28 Dec) are skipped: Tue 29, Wed 30, Thu 31.
        $this->travelTo(Carbon::parse('2026-12-24 09:00', 'America/Toronto'));
        $this->submit($this->tobi(['email' => 'dec@example.ca']), (string) Str::uuid())->assertCreated()->assertJsonPath('data.replyBy', '2026-12-31')
            ->assertJsonPath('data.skippedHolidays.*.name', ['Christmas Day', 'Boxing Day']);

        // Sat 10 Oct: the count starts on the next business day: Tue 13, Wed 14, Thu 15.
        $this->travelTo(Carbon::parse('2026-10-10 11:00', 'America/Toronto'));
        $this->submit($this->tobi(['email' => 'sat@example.ca']), (string) Str::uuid())->assertCreated()->assertJsonPath('data.replyBy', '2026-10-15');
    }

    public function test_the_numbers_count_up_from_the_cast(): void
    {
        $this->submit($this->tobi(['email' => 'one@example.ca']), (string) Str::uuid())->assertCreated()->assertJsonPath('data.number', 'A-0217');
        $this->submit($this->tobi(['email' => 'two@example.ca']), (string) Str::uuid())->assertCreated()->assertJsonPath('data.number', 'A-0218');
    }

    public function test_the_bot_check_runs_first_and_an_idempotency_key_is_required(): void
    {
        $this->submit($this->tobi(['challengeToken' => 'fail']), (string) Str::uuid())->assertStatus(422)->assertJsonValidationErrors(['challengeToken']);
        $this->assertSame(0, ArtistApplication::count());

        $this->flushHeaders()->fromTheWebApp()->postJson(self::APPLICATIONS, $this->tobi())->assertStatus(422)->assertJsonValidationErrors(['idempotencyKey']);
    }

    // M3 S12: refusals and retries (L2-001.3, L2-001.4, L2-047.2, L2-047.3, L2-047.5, L2-075.1, L2-108.3).

    public function test_a_reference_without_a_contact_and_a_reference_that_is_the_applicant_are_named_together(): void
    {
        $tobi = $this->tobi();
        $tobi['references'][0]['contact'] = '';
        $tobi['references'][1]['contact'] = 'Tobi@TobiAdeyemi.ca';

        $response = $this->submit($tobi, (string) Str::uuid());

        $response->assertStatus(422);
        $errors = $response->json('errors');
        $this->assertSame(['Add a phone number or email so we can reach them.'], $errors['references.0.contact']);
        $this->assertSame(['References must be someone other than you.'], $errors['references.1.contact']);
        $this->assertSame(0, ArtistApplication::count());
    }

    public function test_a_base_city_outside_the_service_area_is_refused_and_nothing_is_stored(): void
    {
        $tobi = $this->tobi(['baseCity' => 'Ottawa']);
        $token = $tobi['videos'][0];

        $this->submit($tobi, (string) Str::uuid())->assertStatus(422)
            ->assertJsonPath('errors.baseCity.0', 'Zamaro serves churches within 200 km of Toronto.');

        $this->assertSame(0, ArtistApplication::count());
        $this->assertSame(0, ApplicationReference::count());
        // The video stays the applicant's to send again.
        $this->assertNull(ArtistVideo::where('upload_token', $token)->sole()->artist_application_id);
        Notification::assertNothingSent();
    }

    public function test_a_base_city_that_cannot_be_found_is_refused(): void
    {
        $this->submit($this->tobi(['baseCity' => 'Atlantis']), (string) Str::uuid())->assertStatus(422)
            ->assertJsonPath('errors.baseCity.0', 'We couldn’t find that address. Check the street and postal code.');
        $this->assertSame(0, ArtistApplication::count());
    }

    public function test_a_second_pending_application_from_the_same_email_is_refused_ignoring_case(): void
    {
        $this->submit($this->tobi(), (string) Str::uuid())->assertCreated();

        $response = $this->submit($this->tobi(['email' => 'TOBI@TobiAdeyemi.ca', 'name' => 'T. Adeyemi']), (string) Str::uuid());

        $response->assertStatus(409)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', fn (string $type) => str_ends_with($type, '/problems/application-in-review'))
            ->assertJsonPath('title', 'You already have an application in review')
            ->assertJsonPath('detail', 'We’re reviewing the one you sent from tobi@tobiadeyemi.ca and will reply there. Your answers here are kept.')
            ->assertJsonPath('email', 'tobi@tobiadeyemi.ca');
        $this->assertSame(1, ArtistApplication::count());
        // A decided application does not block a new one.
        ArtistApplication::query()->update(['status' => ApplicationStatus::Rejected]);
        $this->submit($this->tobi(), (string) Str::uuid())->assertCreated()->assertJsonPath('data.number', 'A-0218');
    }

    public function test_a_retry_with_the_same_idempotency_key_answers_the_application_it_created(): void
    {
        $key = (string) Str::uuid();
        $tobi = $this->tobi();
        $first = $this->submit($tobi, $key)->assertCreated();

        // The same payload again, videos included (they now belong to the application): the retry runs
        // before the duplicate-email check, so it is 200, not 409 or 422, and sends no second email.
        $retry = $this->submit($tobi, $key);

        $retry->assertOk()->assertJsonPath('data.number', $first->json('data.number'))->assertJsonPath('data.replyBy', '2026-10-15');
        $this->assertMatchesContract($retry);
        $this->assertSame(1, ArtistApplication::count());
        Notification::assertSentTimes(ApplicationReceivedNotification::class, 1);
    }

    public function test_two_concurrent_sends_from_one_email_create_one_application(): void
    {
        // The other send lands between this one's duplicate check and its insert: the partial unique
        // index on lower(email) where submitted refuses the second row, and the applicant reads 409.
        ArtistApplication::creating(function (): void {
            if (ArtistApplication::count() === 0) {
                DB::table('artist_applications')->insert([
                    'number' => 'A-0300', 'name' => 'Tobi Adeyemi', 'email' => 'Tobi@tobiadeyemi.ca', 'act_type' => 'solo',
                    'base_city' => 'Scarborough', 'base_latitude' => 43.77, 'base_longitude' => -79.25, 'styles' => '["hymns"]',
                    'bio' => str_repeat('x', 100), 'from_price_cents' => 40000, 'max_drive_km' => 80, 'status' => 'submitted',
                    'idempotency_key' => (string) Str::uuid(), 'submitted_at' => now(), 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        });

        $this->submit($this->tobi(), $key = (string) Str::uuid())->assertStatus(409)->assertJsonPath('type', fn (string $type) => str_ends_with($type, '/problems/application-in-review'));

        // This send stored nothing (the other send's row rolls back with the test's transaction here).
        $this->assertSame(0, ArtistApplication::where('idempotency_key', $key)->count());
        $this->assertSame(0, ApplicationReference::count());
        Notification::assertNothingSent();
    }

    /** A video the applicant uploaded and the transcoder finished (M3 S10). */
    private function liveVideo(string $title): ArtistVideo
    {
        $video = app(StartApplicationVideoUpload::class)->handle($title, 'way-maker.mp4', 30_000);
        $video->forceFill(['status' => VideoStatus::Live, 'uploaded_bytes' => 30_000, 'duration_seconds' => 348])->save();

        return $video;
    }

    /**
     * Tobi Adeyemi's application as the mocks show it (docs/mocks/pages/apply).
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function tobi(array $overrides = []): array
    {
        return $overrides + [
            'name' => 'Tobi Adeyemi',
            'email' => 'tobi@tobiadeyemi.ca',
            'baseCity' => 'Scarborough',
            'actType' => 'solo',
            'styles' => ['solo-vocalist', 'acoustic', 'hymns'],
            'bio' => 'I’m a vocalist and keys player from Scarborough, and I’ve led Sunday worship at Cornerstone Baptist for six years. I lead from the piano, so I can carry a service on my own or slot in with your band. My sets mix the hymns your seniors love with newer songs your youth know, and I’m happy to learn what your congregation sings.',
            'fromPrice' => 400,
            'maxDriveKm' => 80,
            'videos' => [$this->liveVideo('Way Maker, live at Cornerstone')->upload_token],
            'references' => [
                ['name' => 'Pastor Samuel Osei', 'church' => 'Cornerstone Baptist, Scarborough', 'contact' => 'samuel.osei@cornerstonebaptist.ca'],
                ['name' => 'Ruth Kim', 'church' => 'Agincourt Community Church', 'contact' => '647 555 0192'],
            ],
            'challengeToken' => 'pass',
        ];
    }

    /** @param  array<string, mixed>  $application */
    private function submit(array $application, string $idempotencyKey): TestResponse
    {
        return $this->flushHeaders()->fromTheWebApp()->withHeader('Idempotency-Key', $idempotencyKey)->postJson(self::APPLICATIONS, $application);
    }
}
