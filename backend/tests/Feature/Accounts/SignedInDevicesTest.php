<?php

namespace Tests\Feature\Accounts;

use App\Models\User;
use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-025.3 (accounts/manage-account-settings): each signed-in session shows its device, approximate
 * city and last-active time, and any can be ended at once. L2-074.2: another person's session is a
 * 404. Raw session IDs and full IP addresses are never returned.
 */
class SignedInDevicesTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const CHROME_WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

    private const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

    private const FIREFOX_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15.6; rv:143.0) Gecko/20100101 Firefox/143.0';

    private string $email;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto'));
        $this->seed(CastSeeder::class);
        $this->email = 'ruth-'.uniqid().'@example.ca';
        $this->artisan('cast:booker', ['email' => $this->email])->assertSuccessful();
    }

    public function test_the_list_starts_with_this_device_then_the_others_most_recent_first(): void
    {
        $this->signInFrom(self::FIREFOX_MAC, '10.0.0.7');
        $this->travel(1)->hours();
        $this->signInFrom(self::SAFARI_IPHONE, '192.168.1.20');
        $this->travel(1)->hours();
        $here = $this->signInFrom(self::CHROME_WINDOWS, '127.0.0.1');

        $response = $this->browser($here)->getJson('/api/v1/account/sessions');

        $response->assertOk();
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
        $sessions = $response->json('data');
        $this->assertSame(['Chrome on Windows', 'Safari on iPhone', 'Firefox on Mac'], array_column($sessions, 'deviceLabel'));
        $this->assertSame([true, false, false], array_column($sessions, 'isCurrent'));
        $this->assertSame(['Burlington, ON', 'Burlington, ON', 'Hamilton, ON'], array_column($sessions, 'approximateCity'));
        $this->assertSame(Carbon::parse('2026-10-09 11:00', 'America/Toronto')->toIso8601String(), $sessions[1]['lastActiveAt']);
        $this->assertStringNotContainsString($here, $response->getContent());
        foreach (['127.0.0.1', '192.168.1.20', '10.0.0.7'] as $ip) {
            $this->assertStringNotContainsString($ip, $response->getContent());
        }
    }

    public function test_an_address_the_locator_does_not_know_has_no_city(): void
    {
        $here = $this->signInFrom(self::CHROME_WINDOWS, '203.0.113.5');

        $this->browser($here)->getJson('/api/v1/account/sessions')->assertJsonPath('data.0.approximateCity', null);
    }

    public function test_ending_a_session_signs_that_device_out_at_once(): void
    {
        $phone = $this->signInFrom(self::SAFARI_IPHONE, '192.168.1.20');
        $here = $this->signInFrom(self::CHROME_WINDOWS, '127.0.0.1');
        $id = collect($this->browser($here)->getJson('/api/v1/account/sessions')->json('data'))->firstWhere('isCurrent', false)['id'];

        $response = $this->browser($here)->deleteJson("/api/v1/account/sessions/{$id}");

        $response->assertNoContent();
        $this->assertMatchesContract($response);
        $this->browser($phone)->getJson('/api/v1/me')->assertUnauthorized();
        $this->browser($here)->getJson('/api/v1/me')->assertOk();
        $this->assertCount(1, $this->browser($here)->getJson('/api/v1/account/sessions')->json('data'));
    }

    public function test_another_persons_session_is_not_found_and_keeps_working(): void
    {
        $theirs = $this->signInFrom(self::SAFARI_IPHONE, '192.168.1.20', 'naomi.fraser@riversidecc.ca');
        $theirId = collect($this->browser($theirs)->getJson('/api/v1/account/sessions')->json('data'))->firstWhere('isCurrent', true)['id'];
        $here = $this->signInFrom(self::CHROME_WINDOWS, '127.0.0.1');

        $response = $this->browser($here)->deleteJson("/api/v1/account/sessions/{$theirId}");

        $response->assertNotFound()->assertJsonPath('type', config('zamaro.problems.base_uri').'/not-found');
        $this->browser($theirs)->getJson('/api/v1/me')->assertOk();
        $this->browser($here)->deleteJson('/api/v1/account/sessions/not-a-session')->assertNotFound();
    }

    public function test_activity_is_recorded_at_most_every_5_minutes(): void
    {
        $here = $this->signInFrom(self::CHROME_WINDOWS, '127.0.0.1');
        $lastActive = fn () => Carbon::parse(DB::table('user_sessions')->where('user_id', $this->user()->id)->value('last_active_at'));

        $this->travel(4)->minutes();
        $this->browser($here)->getJson('/api/v1/me')->assertOk();
        $this->assertTrue($lastActive()->equalTo(Carbon::parse('2026-10-09 10:00', 'America/Toronto')));

        $this->travel(2)->minutes();
        $this->browser($here)->getJson('/api/v1/me')->assertOk();
        $this->assertTrue($lastActive()->equalTo(Carbon::parse('2026-10-09 10:06', 'America/Toronto')));
    }

    public function test_a_session_idle_past_its_lifetime_is_not_listed(): void
    {
        $this->signInFrom(self::FIREFOX_MAC, '10.0.0.7');
        $this->travel(config('session.lifetime') + 1)->minutes();
        $here = $this->signInFrom(self::CHROME_WINDOWS, '127.0.0.1');

        $this->assertSame(['Chrome on Windows'], array_column($this->browser($here)->getJson('/api/v1/account/sessions')->json('data'), 'deviceLabel'));
    }

    public function test_devices_are_named_by_browser_and_system(): void
    {
        $agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0' => 'Edge on Windows',
            'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' => 'Chrome on Android',
            'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1' => 'Safari on iPad',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15' => 'Safari on Mac',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36' => 'Chrome on Linux',
            'curl/8.5.0' => 'Unknown device',
        ];
        foreach ($agents as $agent => $label) {
            $here = $this->signInFrom($agent, '127.0.0.1');
            $this->assertSame($label, $this->browser($here)->getJson('/api/v1/account/sessions')->json('data.0.deviceLabel'), $agent);
        }
    }

    public function test_a_guest_gets_401(): void
    {
        $this->fromTheWebApp()->getJson('/api/v1/account/sessions')->assertUnauthorized();
    }

    /** Signs in from a browser with this user agent and address; answers its session cookie. */
    private function signInFrom(string $agent, string $ip, ?string $email = null): string
    {
        return $this->asANewRequest()->withoutCookies()
            ->withHeader('User-Agent', $agent)
            ->withServerVariables(['REMOTE_ADDR' => $ip])
            ->signIn($email ?? $this->email)->assertOk()
            ->getCookie('zamaro_session')->getValue();
    }

    /** The next request from the browser holding this session cookie. */
    private function browser(string $session): static
    {
        return $this->asANewRequest()->withoutCookies()->fromTheWebApp()->withCookie('zamaro_session', $session);
    }

    private function user(): User
    {
        return User::where('email', $this->email)->sole();
    }
}
