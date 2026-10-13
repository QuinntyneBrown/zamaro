<?php

namespace Tests\Feature\Security;

use App\Enums\Role;
use App\Enums\VscStatus;
use App\Models\User;
use App\Models\VulnerableSectorCheck;
use App\Services\ArtistOnboarding\DocumentVault;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-049.4, L2-074.2 (verify-vulnerable-sector-check): anyone but the check's owner and an
 * administrator gets the same 404 for its document link as for a check that does not exist.
 */
class VscDocumentAccessTest extends TestCase
{
    use RefreshDatabase;
    use UsesTheWebApp;

    private VulnerableSectorCheck $check;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        Storage::fake('documents');
        $stored = app(DocumentVault::class)->store('%PDF-1.4');
        $this->check = VulnerableSectorCheck::create([
            'user_id' => User::where('email', 'abigail@abigailmensah.ca')->sole()->id,
            'issued_on' => '2026-10-05', 'status' => VscStatus::Pending,
            'storage_key' => $stored['key'], 'wrapped_data_key' => $stored['wrappedDataKey'], 'mime_type' => 'application/pdf',
        ]);
    }

    public function test_another_artist_a_booker_and_a_guest_get_the_same_404_as_an_unknown_check(): void
    {
        $elijah = User::where('email', 'elijah-park@cast.zamaro.test')->sole();
        $elijah->forceFill(['password' => Hash::make(config('zamaro.cast_password'))])->save();
        $this->assertContains(Role::Artist, $elijah->roleNames());
        $unknown = $this->asANewRequest()->withoutCookies()->getJson('/api/v1/__nothing-here');

        foreach (['elijah-park@cast.zamaro.test', 'naomi.fraser@riversidecc.ca'] as $email) {
            $session = $this->asANewRequest()->withoutCookies()->signIn($email)->assertOk()->getCookie('zamaro_session')->getValue();
            $this->assertConcealed($this->as($session)->getJson("/api/v1/vulnerable-sector-checks/{$this->check->id}/document-link"), $unknown, $email);
            $this->assertConcealed($this->as($session)->getJson('/api/v1/vulnerable-sector-checks/999999/document-link'), $unknown, "$email, unknown id");
        }
        $this->asANewRequest()->withoutCookies()->fromTheWebApp()->getJson("/api/v1/vulnerable-sector-checks/{$this->check->id}/document-link")->assertUnauthorized();
    }

    private function assertConcealed(TestResponse $response, TestResponse $unknown, string $who): void
    {
        $this->assertSame(404, $response->getStatusCode(), $who);
        foreach (['type', 'title', 'detail'] as $field) {
            $this->assertSame($unknown->json($field), $response->json($field), "$who: $field");
        }
    }

    private function as(string $session): static
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $session);
    }
}
