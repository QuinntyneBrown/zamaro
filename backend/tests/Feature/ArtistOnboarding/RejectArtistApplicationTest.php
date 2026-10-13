<?php

namespace Tests\Feature\ArtistOnboarding;

use App\Enums\ApplicationStatus;
use App\Enums\AuditAction;
use App\Models\Artist;
use App\Models\ArtistApplication;
use App\Models\AuditEntry;
use App\Models\User;
use App\Notifications\ApplicationRejectedNotification;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-048.2, L2-063, L2-069.1 (review-artist-application): rejecting needs a reason from the fixed list
 * and takes a note of up to 1,000 characters; both reach the applicant by email, the decision is
 * stored and audited, and no artist is made.
 */
class RejectArtistApplicationTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const QUEUE = '/api/v1/admin/artist-applications';

    private const NOTE = 'We couldn’t reach Pastor Samuel Osei or Ruth Kim this week. Ask them to expect a call from the Zamaro team, then apply again.';

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        Notification::fake();
        $this->signInPriya();
    }

    public function test_rejecting_stores_the_reason_and_note_emails_both_and_is_audited(): void
    {
        $tobi = $this->application('A-0219');

        $response = $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/rejection", ['reason' => 'references-unconfirmed', 'note' => self::NOTE]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.decision.decidedAt', '2026-10-09T10:00:00-04:00')
            ->assertJsonPath('data.decision.decidedBy.name', 'Priya Nair')
            ->assertJsonPath('data.decision.rejectionReason', 'references-unconfirmed')
            ->assertJsonPath('data.decision.rejectionNote', self::NOTE)
            ->assertJsonPath('data.artist', null);
        $this->assertMatchesContract($response);

        $application = $tobi->fresh();
        $this->assertSame(ApplicationStatus::Rejected, $application->status);
        $this->assertSame('references-unconfirmed', $application->rejection_reason);
        $this->assertSame(self::NOTE, $application->rejection_note);
        $this->assertSame(User::where('email', CastSeeder::PRIYA_EMAIL)->sole()->id, $application->decided_by);
        $this->assertNull(Artist::where('slug', 'tobi-adeyemi')->first());
        $this->assertNull(User::where('email', 'tobi@tobiadeyemi.ca')->first());

        $entry = AuditEntry::where('action', AuditAction::ApplicationRejected)->sole();
        $this->assertSame($tobi->id, $entry->target_id);
        $this->assertSame('references-unconfirmed', $entry->context['reason']);

        Notification::assertSentOnDemand(ApplicationRejectedNotification::class, function (ApplicationRejectedNotification $notification, array $channels, AnonymousNotifiable $notifiable) {
            $this->assertSame('tobi@tobiadeyemi.ca', $notifiable->routes['mail']);
            $mail = $notification->toMail($notifiable);
            $this->assertSame('About your Zamaro application, A-0219', $mail->subject);
            $html = $mail->render()->toHtml();
            $this->assertStringContainsString('Hi Tobi,', $html);
            $this->assertStringContainsString('References could not be confirmed', $html);
            $this->assertStringContainsString('expect a call from the Zamaro team', $html);

            return true;
        });

        // The queue moves on, and names the decision.
        $this->asPriya()->getJson(self::QUEUE)->assertOk()->assertJsonPath('meta.waiting', 2)->assertJsonPath('meta.lastDecidedAt', '2026-10-09T10:00:00-04:00');
    }

    public function test_a_reason_from_the_list_is_required_and_the_note_is_capped(): void
    {
        $tobi = $this->application('A-0219');

        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/rejection", [])->assertStatus(422)
            ->assertJsonPath('errors.reason.0', 'Choose a reason from the list.');
        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/rejection", ['reason' => 'did-not-like-it'])->assertStatus(422)
            ->assertJsonPath('errors.reason.0', 'Choose a reason from the list.');
        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/rejection", ['reason' => 'other', 'note' => str_repeat('x', 1001)])->assertStatus(422)
            ->assertJsonValidationErrors(['note']);

        $this->assertSame(ApplicationStatus::Submitted, $tobi->fresh()->status);
        Notification::assertNothingSent();

        // Without a note the email carries the reason alone.
        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/rejection", ['reason' => 'outside-service-area'])->assertOk()
            ->assertJsonPath('data.decision.rejectionNote', null);
        Notification::assertSentOnDemand(ApplicationRejectedNotification::class, fn (ApplicationRejectedNotification $notification, array $channels, AnonymousNotifiable $notifiable) => str_contains($notification->toMail($notifiable)->render()->toHtml(), 'Outside the Zamaro service area'));
    }

    public function test_a_decided_application_cannot_be_rejected_again(): void
    {
        $tobi = $this->application('A-0219');
        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/rejection", ['reason' => 'other'])->assertOk();

        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/rejection", ['reason' => 'other'])->assertStatus(409)
            ->assertJsonPath('type', fn (string $type) => str_ends_with($type, '/problems/application-already-decided'));
        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/approval")->assertStatus(409);
        $this->assertSame(1, AuditEntry::where('action', AuditAction::ApplicationRejected)->count());
    }

    private function application(string $number): ArtistApplication
    {
        return ArtistApplication::where('number', $number)->sole();
    }

    private function signInPriya(): void
    {
        $pending = $this->asANewRequest()->withoutCookies()->signIn(CastSeeder::PRIYA_EMAIL)->assertStatus(202)->getCookie('zamaro_session')->getValue();
        $this->session = $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $pending)
            ->postJson('/api/v1/session/two-factor', ['code' => (new Google2FA)->getCurrentOtp(CastSeeder::PRIYA_TOTP_SECRET)])
            ->assertOk()->getCookie('zamaro_session')->getValue();
    }

    private function asPriya(): static
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $this->session);
    }
}
