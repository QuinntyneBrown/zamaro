<?php

namespace Tests\Feature\ArtistOnboarding;

use App\Enums\ApplicationStatus;
use App\Enums\ArtistStatus;
use App\Enums\AuditAction;
use App\Enums\Role;
use App\Models\Artist;
use App\Models\ArtistApplication;
use App\Models\ArtistVideo;
use App\Models\AuditEntry;
use App\Models\SlugHistory;
use App\Models\User;
use App\Notifications\ApplicationApprovedNotification;
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
 * L2-048.1, L2-048.3, L2-063, L2-069.1 (review-artist-application): approving a Submitted application
 * with both references verified grants the Artist role, creates an unpublished artist that search and
 * the slug route leave out until payout setup, emails the next step, and is audited; approving without
 * both ticks is refused, and a second decision is a conflict.
 */
class ApproveArtistApplicationTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const QUEUE = '/api/v1/admin/artist-applications';

    private const BURLINGTON = ['lat' => 43.325, 'lng' => -79.799, 'place' => 'Burlington', 'radius' => 120];

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        Notification::fake();
        $this->signInPriya();
    }

    public function test_approving_grants_the_role_creates_a_hidden_artist_emails_the_next_step_and_is_audited(): void
    {
        $tobi = $this->application('A-0219');
        $this->verifyBoth($tobi);
        $this->assertNull(User::where('email', 'tobi@tobiadeyemi.ca')->first());
        $highestTicket = Artist::query()->get()->max(fn (Artist $artist) => (int) substr($artist->ticket_number, 4));

        $response = $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/approval");

        $response->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.decision.decidedAt', '2026-10-09T10:00:00-04:00')
            ->assertJsonPath('data.decision.decidedBy.name', 'Priya Nair')
            ->assertJsonPath('data.decision.rejectionReason', null)
            ->assertJsonPath('data.artist.slug', 'tobi-adeyemi')
            ->assertJsonPath('data.artist.payoutReady', false);
        $this->assertMatchesContract($response);

        // The applicant had no account (M3 D3): one is made for the address, with the Artist role.
        $user = User::where('email', 'tobi@tobiadeyemi.ca')->sole();
        $this->assertSame('Tobi Adeyemi', $user->name);
        $this->assertContains(Role::Artist, $user->roleNames());
        $this->assertNotNull($user->email_verified_at);

        $artist = Artist::where('slug', 'tobi-adeyemi')->sole();
        $this->assertSame($user->id, $artist->user_id);
        $this->assertSame(ArtistStatus::Approved, $artist->status);
        $this->assertFalse($artist->payout_ready);
        $this->assertNull($artist->published_at);
        $this->assertSame('2026-10-09T14:00:00+00:00', $artist->approved_at->toIso8601String());
        $this->assertSame(sprintf('ACT-%04d', $highestTicket + 1), $artist->ticket_number);
        $this->assertSame('Tobi Adeyemi', $artist->display_name);
        $this->assertSame('Scarborough', $artist->base_city);
        $this->assertSame(40000, $artist->from_price_cents);
        $this->assertSame(80, $artist->max_drive_km);
        $this->assertSame(['solo-vocalist', 'acoustic', 'hymns'], $artist->styles->pluck('style')->map(fn ($style) => $style->value)->all());
        $this->assertStringStartsWith('I’m a vocalist', (string) $artist->bio);
        $this->assertNotNull(SlugHistory::where('slug', 'tobi-adeyemi')->where('artist_id', $artist->id)->whereNull('retired_at')->first());
        // The video moves to the artist.
        $video = ArtistVideo::where('artist_application_id', $tobi->id)->sole();
        $this->assertSame($artist->id, $video->artist_id);

        $application = $tobi->fresh();
        $this->assertSame(ApplicationStatus::Approved, $application->status);
        $this->assertSame(User::where('email', CastSeeder::PRIYA_EMAIL)->sole()->id, $application->decided_by);

        $approved = AuditEntry::where('action', AuditAction::ApplicationApproved)->sole();
        $this->assertSame($tobi->id, $approved->target_id);
        $this->assertSame($artist->id, $approved->context['artist_id']);
        $granted = AuditEntry::where('action', AuditAction::RoleChanged)->where('target_id', $user->id)->sole();
        $this->assertSame('artist', $granted->context['granted']);

        // Not public until payouts are set up (L2-048.3): out of every search and off the address.
        $this->assertNotContains('Tobi Adeyemi', $this->lineupOn('2026-11-14', 'worship-night'));
        $this->asANewRequest()->withoutCookies()->getJson('/api/v1/artists/tobi-adeyemi')->assertNotFound();

        Notification::assertSentOnDemand(ApplicationApprovedNotification::class, function (ApplicationApprovedNotification $notification, array $channels, AnonymousNotifiable $notifiable) {
            $this->assertSame('tobi@tobiadeyemi.ca', $notifiable->routes['mail']);
            $mail = $notification->toMail($notifiable);
            $this->assertSame('You’re approved, Tobi: set up payouts next', $mail->subject);
            $html = $mail->render()->toHtml();
            $this->assertStringContainsString('Hi Tobi,', $html);
            $this->assertStringContainsString('/reset-password/', $html);

            return true;
        });
    }

    public function test_an_applicant_with_an_account_keeps_it_and_gains_the_role(): void
    {
        $tobi = $this->application('A-0219');
        $this->verifyBoth($tobi);
        $existing = User::create(['name' => 'T. Adeyemi', 'email' => 'Tobi@TobiAdeyemi.ca', 'password' => 'hosanna-in-the-highest']);
        $existing->grantRoles([Role::Booker]);

        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/approval")->assertOk();

        $this->assertSame(1, User::whereRaw('lower(email) = ?', ['tobi@tobiadeyemi.ca'])->count());
        $user = $existing->fresh();
        $this->assertEqualsCanonicalizing([Role::Booker, Role::Artist], $user->roleNames());
        $this->assertSame($user->id, Artist::where('slug', 'tobi-adeyemi')->sole()->user_id);
        Notification::assertSentOnDemand(ApplicationApprovedNotification::class, function (ApplicationApprovedNotification $notification, array $channels, AnonymousNotifiable $notifiable) {
            // Someone with a password signs in as usual: no set-password link.
            $this->assertStringNotContainsString('/reset-password/', $notification->toMail($notifiable)->render()->toHtml());

            return true;
        });
    }

    public function test_the_slug_avoids_names_already_taken(): void
    {
        $tobi = $this->application('A-0219');
        $this->verifyBoth($tobi);
        // Abigail Mensah's address is taken; an application in her name gets the next free one.
        $tobi->update(['name' => 'Abigail Mensah']);

        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/approval")->assertOk()->assertJsonPath('data.artist.slug', 'abigail-mensah-2');
    }

    public function test_approving_needs_both_references_verified(): void
    {
        $tobi = $this->application('A-0219');
        $osei = $tobi->references()->first();
        $this->asPriya()->putJson(self::QUEUE."/{$tobi->id}/references/{$osei->id}/verification", ['verified' => true])->assertOk();

        $response = $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/approval");

        $response->assertStatus(422)->assertJsonPath('errors.references.0', 'Verify both references before you approve.');
        $this->assertSame(ApplicationStatus::Submitted, $tobi->fresh()->status);
        $this->assertNull(Artist::where('slug', 'tobi-adeyemi')->first());
        Notification::assertNothingSent();
    }

    public function test_a_second_decision_is_a_conflict(): void
    {
        $tobi = $this->application('A-0219');
        $this->verifyBoth($tobi);
        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/approval")->assertOk();

        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/approval")->assertStatus(409)
            ->assertJsonPath('type', fn (string $type) => str_ends_with($type, '/problems/application-already-decided'));
        $this->asPriya()->postJson(self::QUEUE."/{$tobi->id}/rejection", ['reason' => 'other'])->assertStatus(409);

        $this->assertSame(1, Artist::where('slug', 'like', 'tobi-adeyemi%')->count());
        $this->asPriya()->getJson(self::QUEUE)->assertOk()->assertJsonPath('meta.waiting', 2)->assertJsonPath('meta.lastDecidedAt', '2026-10-09T10:00:00-04:00');
    }

    private function verifyBoth(ArtistApplication $application): void
    {
        foreach ($application->references as $reference) {
            $this->asPriya()->putJson(self::QUEUE."/{$application->id}/references/{$reference->id}/verification", ['verified' => true])->assertOk();
        }
    }

    private function application(string $number): ArtistApplication
    {
        return ArtistApplication::where('number', $number)->sole();
    }

    /** @return list<string> */
    private function lineupOn(string $date, string $kind): array
    {
        $response = $this->asANewRequest()->withoutCookies()->getJson('/api/v1/search?'.http_build_query(['date' => $date, 'kind' => $kind] + self::BURLINGTON))->assertOk();

        return array_values(array_filter([$response->json('headliner.name'), ...$response->json('data.*.name')]));
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
