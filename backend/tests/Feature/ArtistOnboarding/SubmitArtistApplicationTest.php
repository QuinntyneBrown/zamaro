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
