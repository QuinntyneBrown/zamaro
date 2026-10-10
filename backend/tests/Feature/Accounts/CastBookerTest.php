<?php

namespace Tests\Feature\Accounts;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * `cast:booker` (M2 plan D19): e2e specs that change data get a fresh booker who can sign in, and
 * production never gets one.
 */
class CastBookerTest extends TestCase
{
    use RefreshDatabase;
    use UsesTheWebApp;

    public function test_it_makes_a_verified_booker_who_signs_in_with_the_cast_password(): void
    {
        $this->artisan('cast:booker', ['email' => 'booker-1@e2e.zamaro.test'])->assertSuccessful();

        $this->signIn('booker-1@e2e.zamaro.test')
            ->assertOk()
            ->assertJsonPath('data.roles', ['booker'])
            ->assertJsonPath('data.emailVerified', true);
    }

    public function test_it_refuses_to_run_in_production(): void
    {
        $this->app['env'] = 'production';

        $this->artisan('cast:booker', ['email' => 'booker-2@e2e.zamaro.test'])->assertFailed();

        $this->assertDatabaseMissing('users', ['email' => 'booker-2@e2e.zamaro.test']);
    }
}
