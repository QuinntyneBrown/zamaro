<?php

namespace Tests\Feature\ArtistOnboarding;

use App\Enums\AuditAction;
use App\Enums\VscStatus;
use App\Models\AuditEntry;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use App\Services\ArtistOnboarding\DocumentVault;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use PragmaRX\Google2FA\Google2FA;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-049.4, L2-076.3, L2-089 (verify-vulnerable-sector-check, scan-and-serve-uploads): the owner and an
 * administrator get a 5-minute signed link on the media host, which streams the document with
 * server-set headers; an altered or expired link, or the same path on the API host, is 404.
 */
class VscDocumentLinkTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const PDF = "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n";

    private VulnerableSectorCheck $check;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        Storage::fake('documents');
        $stored = app(DocumentVault::class)->store(self::PDF);
        $this->check = VulnerableSectorCheck::create([
            'user_id' => User::where('email', 'abigail@abigailmensah.ca')->sole()->id,
            'issued_on' => '2026-10-05', 'status' => VscStatus::Pending,
            'storage_key' => $stored['key'], 'wrapped_data_key' => $stored['wrappedDataKey'],
            'mime_type' => 'application/pdf', 'size_bytes' => strlen(self::PDF),
        ]);
    }

    public function test_the_owner_gets_a_five_minute_link_on_the_media_host(): void
    {
        $response = $this->as($this->signIn('abigail@abigailmensah.ca'))->getJson($this->linkPath());

        $response->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->assertMatchesContract($response);
        $url = $response->json('data.url');
        $this->assertSame('media.localhost', parse_url($url, PHP_URL_HOST));
        $this->assertStringStartsWith('/documents/'.$this->check->storage_key, parse_url($url, PHP_URL_PATH));
        $this->assertSame(now()->addMinutes(5)->toIso8601String(), $response->json('data.expiresAt'));
        $this->assertSame(0, AuditEntry::where('action', AuditAction::VscDocumentViewed)->count());
    }

    public function test_an_administrators_link_is_recorded_in_the_audit_log(): void
    {
        $response = $this->as($this->signInPriya())->getJson($this->linkPath())->assertOk();

        $entry = AuditEntry::where('action', AuditAction::VscDocumentViewed)->sole();
        $this->assertSame(User::where('email', CastSeeder::PRIYA_EMAIL)->sole()->id, $entry->actor_id);
        $this->assertSame($this->check->id, $entry->target_id);
        $this->assertSame('media.localhost', parse_url($response->json('data.url'), PHP_URL_HOST));
    }

    public function test_the_link_streams_the_document_with_server_set_headers(): void
    {
        $url = $this->as($this->signIn('abigail@abigailmensah.ca'))->getJson($this->linkPath())->json('data.url');

        $document = $this->asANewRequest()->withoutCookies()->get($url);

        $document->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')
            ->assertHeader('Content-Disposition', 'attachment; filename="vulnerable-sector-check.pdf"')
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        $this->assertSame(self::PDF, $document->streamedContent());
    }

    public function test_an_altered_or_expired_link_and_the_api_host_are_not_found(): void
    {
        $url = $this->as($this->signIn('abigail@abigailmensah.ca'))->getJson($this->linkPath())->json('data.url');
        $unknown = $this->asANewRequest()->withoutCookies()->getJson('/api/v1/__nothing-here');

        $altered = $this->asANewRequest()->withoutCookies()->get(preg_replace('/signature=([0-9a-f])/', 'signature=0', $url));
        $altered->assertNotFound();
        $this->assertSame($unknown->json('title'), $altered->json('title'));

        $onApiHost = $this->asANewRequest()->withoutCookies()->get(str_replace('http://media.localhost', 'http://localhost', $url));
        $onApiHost->assertNotFound();

        $this->travel(5)->minutes();
        $this->asANewRequest()->withoutCookies()->get($url)->assertOk();
        $this->travel(2)->seconds();
        $this->asANewRequest()->withoutCookies()->get($url)->assertNotFound();
    }

    private function linkPath(): string
    {
        return "/api/v1/vulnerable-sector-checks/{$this->check->id}/document-link";
    }

    private function signIn(string $email, ?string $password = null): string
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->postJson('/api/v1/session', [
            'email' => $email, 'password' => $password ?? config('zamaro.cast_password'),
        ])->assertOk()->getCookie('zamaro_session')->getValue();
    }

    private function signInPriya(): string
    {
        $pending = $this->asANewRequest()->withoutCookies()->fromTheWebApp()->postJson('/api/v1/session', [
            'email' => CastSeeder::PRIYA_EMAIL, 'password' => config('zamaro.cast_password'),
        ])->assertStatus(202)->getCookie('zamaro_session')->getValue();

        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $pending)
            ->postJson('/api/v1/session/two-factor', ['code' => (new Google2FA)->getCurrentOtp(CastSeeder::PRIYA_TOTP_SECRET)])
            ->assertOk()->getCookie('zamaro_session')->getValue();
    }

    private function as(string $session): static
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $session);
    }
}
