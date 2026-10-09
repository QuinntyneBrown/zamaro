<?php

namespace App\Support\Problems;

use Illuminate\Http\JsonResponse;

/**
 * An RFC 9457 problem details body (L2-095.2).
 */
final class ProblemDetails
{
    /**
     * @param  array<string, list<string>>|null  $errors  422 only, keyed by field path
     */
    public function __construct(
        public readonly string $type,
        public readonly string $title,
        public readonly int $status,
        public readonly string $detail,
        public readonly ?string $requestId,
        public readonly ?array $errors = null,
    ) {}

    public static function of(ProblemType $type, string $detail, ?string $requestId): self
    {
        return new self($type->uri(), $type->title(), $type->status(), $detail, $requestId);
    }

    /**
     * @param  array<string, string>  $headers
     */
    public function toResponse(array $headers = []): JsonResponse
    {
        $body = [
            'type' => $this->type,
            'title' => $this->title,
            'status' => $this->status,
            'detail' => $this->detail,
            'requestId' => $this->requestId,
        ];
        if ($this->errors !== null) {
            $body['errors'] = $this->errors;
        }

        return new JsonResponse(
            $body,
            $this->status,
            ['Content-Type' => 'application/problem+json'] + $headers,
            JSON_UNESCAPED_SLASHES,
        );
    }
}
