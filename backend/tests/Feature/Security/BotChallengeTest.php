<?php

namespace Tests\Feature\Security;

use App\Contracts\BotChallenge;
use App\Integrations\BotChallenge\FakeBotChallenge;
use Database\Seeders\LegalDocumentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-077.4: registration needs a passing bot challenge before anything else runs. A failed, missing
 * or unverifiable token gets the same 422 on `challengeToken` (security/limit-request-rates, M2 D3).
 */
class BotChallengeTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const MESSAGE = 'We couldn’t check that you’re a person. Try again; if it keeps happening, email hello@zamaro.ca.';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(LegalDocumentSeeder::class);
        Notification::fake();
    }

    public function test_a_failed_challenge_is_refused_and_nothing_is_created(): void
    {
        $response = $this->register('fail');

        $response->assertStatus(422)
            ->assertJsonPath('errors.challengeToken.0', self::MESSAGE)
            ->assertJsonMissingPath('errors.password');
        $this->assertMatchesContract($response);
        $this->assertDatabaseMissing('users', ['email' => 'ruth.adeyemi@gracepoint.ca']);
        Notification::assertNothingSent();
    }

    public function test_a_missing_token_is_refused_the_same_way(): void
    {
        $this->register(null)->assertStatus(422)->assertJsonPath('errors.challengeToken.0', self::MESSAGE);
    }

    public function test_an_unreachable_provider_fails_closed(): void
    {
        $this->app->instance(BotChallenge::class, new FakeBotChallenge(unreachable: true));

        $this->register('pass')->assertStatus(422)->assertJsonPath('errors.challengeToken.0', self::MESSAGE);
        $this->assertDatabaseMissing('users', ['email' => 'ruth.adeyemi@gracepoint.ca']);
    }

    public function test_a_passing_token_lets_the_registration_through(): void
    {
        $this->register('pass')->assertStatus(202);
    }

    private function register(?string $token): TestResponse
    {
        return $this->fromTheWebApp()->postJson('/api/v1/register', array_filter([
            'name' => 'Ruth Adeyemi',
            'email' => 'ruth.adeyemi@gracepoint.ca',
            'password' => 'hosanna-in-the-highest',
            'acceptedTerms' => true,
            'marketingOptIn' => false,
            'termsVersion' => '2026-10',
            'privacyPolicyVersion' => '2026-10',
            'challengeToken' => $token,
        ], fn ($value) => $value !== null));
    }
}
