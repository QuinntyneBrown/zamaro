<?php

namespace Tests\Feature\Security;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\AssertsOpenApiContract;
use Tests\Concerns\UsesTheWebApp;
use Tests\TestCase;

/**
 * L2-075.4: a body over 1 MB to a non-upload endpoint is refused with 413. L2-095.1: the API accepts
 * JSON, so any other body is refused with 415 (security/authorise-and-validate-requests,
 * operations/apply-api-conventions).
 */
class RequestValidationTest extends TestCase
{
    use AssertsOpenApiContract;
    use RefreshDatabase;
    use UsesTheWebApp;

    private const ONE_MEGABYTE = 1_048_576;

    public function test_a_body_one_byte_over_a_megabyte_gets_the_413_problem(): void
    {
        $response = $this->postBody($this->signInBodyOf(self::ONE_MEGABYTE + 1), 'application/json');

        $response->assertStatus(413)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/payload-too-large')
            ->assertJsonPath('status', 413);
        $this->assertMatchesContract($response);
    }

    public function test_a_body_of_exactly_a_megabyte_reaches_validation(): void
    {
        $this->postBody($this->signInBodyOf(self::ONE_MEGABYTE), 'application/json')
            ->assertStatus(422)
            ->assertJsonPath('errors.password.0', fn ($message) => $message !== null);
    }

    public function test_a_body_whose_declared_length_is_over_a_megabyte_is_refused_before_it_is_read(): void
    {
        $this->postBody('{}', 'application/json', ['CONTENT_LENGTH' => (string) (self::ONE_MEGABYTE + 1)])
            ->assertStatus(413);
    }

    #[DataProvider('bodiesThatAreNotJson')]
    public function test_a_body_that_is_not_json_gets_the_415_problem(string $contentType, string $body): void
    {
        $response = $this->postBody($body, $contentType);

        $response->assertStatus(415)
            ->assertHeader('Content-Type', 'application/problem+json')
            ->assertJsonPath('type', config('zamaro.problems.base_uri').'/unsupported-media-type')
            ->assertJsonPath('status', 415);
        $this->assertMatchesContract($response);
    }

    /** @return array<string, array{string, string}> */
    public static function bodiesThatAreNotJson(): array
    {
        return [
            'plain text' => ['text/plain', 'email=naomi.fraser@riversidecc.ca'],
            'a form' => ['application/x-www-form-urlencoded', 'email=naomi.fraser%40riversidecc.ca&password=x'],
            'no content type' => ['', '{"email":"naomi.fraser@riversidecc.ca"}'],
        ];
    }

    public function test_json_with_a_charset_is_json(): void
    {
        $this->postBody('{"email":"","password":""}', 'application/json; charset=utf-8')->assertStatus(422);
    }

    public function test_a_request_without_a_body_needs_no_content_type(): void
    {
        $this->fromTheWebApp()->call('DELETE', '/api/v1/session', server: ['HTTP_ACCEPT' => 'application/json'])
            ->assertUnauthorized();
    }

    /** A sign-in body padded with a password to exactly this many bytes. */
    private function signInBodyOf(int $bytes): string
    {
        $empty = '{"email":"naomi.fraser@riversidecc.ca","password":""}';

        return str_replace('"password":""', '"password":"'.str_repeat('a', $bytes - strlen($empty)).'"', $empty);
    }

    /** @param  array<string, string>  $server */
    private function postBody(string $body, string $contentType, array $server = []): TestResponse
    {
        $server += ['HTTP_ACCEPT' => 'application/json'];
        if ($contentType !== '') {
            $server['CONTENT_TYPE'] = $contentType;
        }

        return $this->fromTheWebApp()->call('POST', '/api/v1/session', server: $server, content: $body);
    }
}
