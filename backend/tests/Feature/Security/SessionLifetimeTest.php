<?php

namespace Tests\Feature\Security;

use Database\Seeders\CastSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-073.3: a booker's or artist's session ends after 7 days without a request, or 30 days after
 * signing in however active it is, and the person must sign in again (manage-sessions-and-csrf).
 */
class SessionLifetimeTest extends TestCase
{
    use RefreshDatabase;
    use UsesTheWebApp;

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo($this->signedInAt());
        $this->seed(CastSeeder::class);
    }

    public function test_a_session_used_within_7_days_is_still_signed_in(): void
    {
        $this->signInAs('naomi.fraser@riversidecc.ca');

        $this->travelTo($this->signedInAt()->addDays(7)->subMinute());

        $this->me()->assertOk();
    }

    public function test_a_session_idle_for_7_days_has_ended(): void
    {
        $this->signInAs('naomi.fraser@riversidecc.ca');

        $this->travelTo($this->signedInAt()->addDays(7)->addMinute());

        $this->me()->assertUnauthorized();
    }

    public function test_a_session_used_every_6_days_still_ends_30_days_after_sign_in(): void
    {
        $this->signInAs('abigail@abigailmensah.ca');
        $this->useItEvery6Days();

        $this->travelTo($this->signedInAt()->addDays(30));

        $this->me()->assertUnauthorized()
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/unauthenticated');
        $this->travelTo($this->signedInAt()->addDays(30)->addMinute());
        $this->me()->assertUnauthorized();
    }

    public function test_a_minute_before_the_30_day_limit_the_session_still_works(): void
    {
        $this->signInAs('naomi.fraser@riversidecc.ca');
        $this->useItEvery6Days();

        $this->travelTo($this->signedInAt()->addDays(30)->subMinute());

        $this->me()->assertOk();
    }

    public function test_at_the_30_day_limit_an_anonymous_route_answers_401_once_then_as_a_guest(): void
    {
        $this->signInAs('naomi.fraser@riversidecc.ca');
        $this->useItEvery6Days();
        $this->travelTo($this->signedInAt()->addDays(30));

        $this->keep($this->withTheSession()->getJson('/api/v1/features'))->assertUnauthorized();
        $this->keep($this->withTheSession()->getJson('/api/v1/features'))->assertOk();
    }

    /** 10:00 in Toronto, in UTC so that a day is 24 hours across the clocks going back on 1 Nov. */
    private function signedInAt(): Carbon
    {
        return Carbon::parse('2026-10-09 14:00', 'UTC');
    }

    private function signInAs(string $email): void
    {
        $this->session = $this->signIn($email)->assertOk()->getCookie('zamaro_session')->getValue();
    }

    private function useItEvery6Days(): void
    {
        foreach ([6, 12, 18, 24] as $day) {
            $this->travelTo($this->signedInAt()->addDays($day));
            $this->me()->assertOk();
        }
    }

    /** `/me` with the cookie the browser holds. */
    private function me(): TestResponse
    {
        return $this->keep($this->withTheSession()->getJson('/api/v1/me'));
    }

    private function withTheSession(): static
    {
        return $this->asANewRequest()->fromTheWebApp()->withCookie('zamaro_session', $this->session);
    }

    /** A new session cookie in the answer replaces the old one, as in a browser. */
    private function keep(TestResponse $response): TestResponse
    {
        $cookie = $response->getCookie('zamaro_session');
        if ($cookie !== null && ! $cookie->isCleared()) {
            $this->session = $cookie->getValue();
        }

        return $response;
    }
}
