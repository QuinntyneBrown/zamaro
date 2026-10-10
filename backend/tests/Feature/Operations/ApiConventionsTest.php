<?php

namespace Tests\Feature\Operations;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/**
 * L2-093.1: request IDs and structured request logs.
 * L2-095.2: RFC 9457 problem details for every error.
 */
class ApiConventionsTest extends TestCase
{
    public function test_a_request_without_an_id_gets_a_generated_uuid(): void
    {
        $response = $this->get('/health/live');

        $this->assertTrue(Str::isUuid($response->headers->get('X-Request-Id')));
    }

    public function test_a_well_formed_inbound_request_id_is_echoed(): void
    {
        $id = (string) Str::uuid();

        $this->get('/health/live', ['X-Request-Id' => $id])
            ->assertHeader('X-Request-Id', $id);
    }

    public function test_a_malformed_inbound_request_id_is_replaced(): void
    {
        $response = $this->get('/health/live', ['X-Request-Id' => 'not-a-uuid']);

        $id = $response->headers->get('X-Request-Id');
        $this->assertNotSame('not-a-uuid', $id);
        $this->assertTrue(Str::isUuid($id));
    }

    public function test_an_unknown_api_route_returns_a_404_problem_carrying_the_request_id(): void
    {
        $response = $this->get('/api/v1/does-not-exist');

        $response->assertNotFound()
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonStructure(['type', 'title', 'status', 'detail', 'requestId'])
            ->assertJsonPath('status', 404)
            ->assertJsonPath('requestId', $response->headers->get('X-Request-Id'));
    }

    public function test_an_unhandled_exception_returns_a_generic_500_problem_without_internals(): void
    {
        config(['app.debug' => true]);
        Route::get('api/v1/__boom', fn () => throw new RuntimeException('database password is hunter2'));

        $response = $this->get('/api/v1/__boom');

        $response->assertStatus(500)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('status', 500)
            ->assertJsonPath('requestId', $response->headers->get('X-Request-Id'))
            ->assertJsonMissingPath('trace')
            ->assertJsonMissingPath('exception');
        $this->assertStringNotContainsString('hunter2', $response->getContent());
    }

    public function test_a_wrong_method_returns_a_405_problem_of_type_about_blank(): void
    {
        $this->post('/health/live')
            ->assertStatus(405)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', 'about:blank')
            ->assertJsonPath('title', 'Method Not Allowed')
            ->assertJsonPath('status', 405);
    }

    public function test_every_request_writes_one_json_log_line_carrying_the_request_id(): void
    {
        $logFile = tempnam(sys_get_temp_dir(), 'zamaro-log');
        config([
            'logging.default' => 'stderr',
            'logging.channels.stderr.with.stream' => $logFile,
        ]);
        Log::forgetChannel('stderr');

        $response = $this->get('/api/v1/does-not-exist');

        $requestLines = collect(file($logFile, FILE_IGNORE_NEW_LINES))
            ->map(fn (string $line) => json_decode($line, true, flags: JSON_THROW_ON_ERROR))
            ->where('message', 'request')
            ->values();
        $this->assertCount(1, $requestLines);
        $this->assertSame($response->headers->get('X-Request-Id'), $requestLines[0]['extra']['request_id']);
        $this->assertSame('GET', $requestLines[0]['context']['method']);
        $this->assertSame(404, $requestLines[0]['context']['status']);
        $this->assertArrayHasKey('route', $requestLines[0]['context']);
        $this->assertIsInt($requestLines[0]['context']['duration_ms']);
        $this->assertSame(config('zamaro.release'), $requestLines[0]['context']['release']);
    }
}
