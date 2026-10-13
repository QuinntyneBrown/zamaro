<?php

namespace Tests\Feature\Operations;

use Tests\Concerns\AssertsOpenApiContract;
use Tests\TestCase;

/**
 * Feature flags (ADR-0012): unfinished features stay off until an environment turns them on.
 */
class FeatureFlagsTest extends TestCase
{
    use AssertsOpenApiContract;

    public function test_booking_requests_are_off_until_an_environment_turns_them_on(): void
    {
        $response = $this->getJson('/api/v1/features');

        $response->assertOk()->assertExactJson(['data' => ['bookingRequests' => false]]);
        $this->assertStringContainsString('public', $response->headers->get('Cache-Control'));
        $this->assertMatchesContract($response);
    }

    public function test_an_environment_turns_a_flag_on_by_configuration(): void
    {
        config(['zamaro.features.booking_requests' => true]);

        $this->getJson('/api/v1/features')->assertOk()->assertJsonPath('data.bookingRequests', true);
    }
}
