<?php

namespace Tests\Concerns;

use Dedoc\Scramble\Generator;
use Illuminate\Testing\TestResponse;
use Opis\JsonSchema\Errors\ErrorFormatter;
use Opis\JsonSchema\Validator;

/**
 * L2-095.3: every API response must match the OpenAPI 3.1 document generated from the code (ADR-0006).
 */
trait AssertsOpenApiContract
{
    private static ?object $openApi = null;

    protected function assertMatchesContract(TestResponse $response): void
    {
        $request = $response->baseRequest;
        $route = $request->route();
        $this->assertNotNull($route, 'The response has no matched route, so it has no documented operation.');

        $path = '/'.ltrim(substr('/'.$route->uri(), strlen('/api/v1')), '/');
        $method = strtolower($request->method());
        $status = (string) $response->getStatusCode();
        $contentType = strtok((string) $response->headers->get('Content-Type'), ';');

        $operation = self::openApi()->paths->{$path}->{$method} ?? null;
        $this->assertNotNull($operation, "OpenAPI documents no {$method} {$path}.");

        $documented = $operation->responses->{$status} ?? null;
        $this->assertNotNull($documented, "OpenAPI documents no {$status} response for {$method} {$path}.");
        $pointer = $this->responsePointer($path, $method, $status, $documented);

        $this->assertObjectHasProperty($contentType, $this->resolve($pointer)->content ?? (object) [],
            "OpenAPI documents no {$contentType} body for {$status} on {$method} {$path}.");

        $validator = new Validator;
        $validator->resolver()->registerRaw(self::openApi(), 'urn:zamaro:openapi');
        $result = $validator->validate(
            json_decode($response->getContent()),
            (object) ['$ref' => 'urn:zamaro:openapi#'.$pointer.'/content/'.$this->escape($contentType).'/schema'],
        );

        $this->assertTrue($result->isValid(), "The {$status} body for {$method} {$path} does not match OpenAPI:\n"
            .json_encode($result->hasError() ? (new ErrorFormatter)->format($result->error()) : [], JSON_PRETTY_PRINT));
    }

    private static function openApi(): object
    {
        return self::$openApi ??= json_decode(json_encode(app(Generator::class)(), JSON_UNESCAPED_SLASHES));
    }

    /** JSON pointer to the response object, following a `$ref` into components/responses. */
    private function responsePointer(string $path, string $method, string $status, object $documented): string
    {
        if (isset($documented->{'$ref'})) {
            return substr($documented->{'$ref'}, 1);
        }

        return '/paths/'.$this->escape($path).'/'.$method.'/responses/'.$status;
    }

    private function resolve(string $pointer): object
    {
        $node = self::openApi();
        foreach (array_slice(explode('/', $pointer), 1) as $segment) {
            $node = $node->{str_replace(['~1', '~0'], ['/', '~'], rawurldecode($segment))};
        }

        return $node;
    }

    /** One JSON pointer segment, percent-encoded so it is valid in a URI fragment. */
    private function escape(string $segment): string
    {
        return rawurlencode(str_replace(['~', '/'], ['~0', '~1'], $segment));
    }
}
